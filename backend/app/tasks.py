import asyncio
import time
from collections import defaultdict

import fitz
from doclayout_yolo import YOLOv10

from app.core.celery_app import celery_app
from app.core.db import get_mongodb_engine
from app.core.myhome_client import MyHomeClient
from app.crud import crud_announcement, crud_layout, crud_llm_output
from app.enums import AnnouncementType
from app.pdf_analysis.analyzer import analyze_pdf
from app.pdf_analysis.layout_parsers import (
    get_layout_model_path,
    parse_layout_from_image,
)
from app.pdf_analysis.strategies.factory import get_strategy
from app.pdf_analysis.utils import pixmap_to_image
from app.schemas.announcement import AnnouncementCreate
from app.schemas.layout import LayoutCreate
from app.services.llm_service import perform_announcement_analysis


@celery_app.task(acks_late=True)
def example_task(word: str) -> str:
    """An example background task that waits 5 seconds and returns a message."""
    print(f"Received task with word: {word}")
    time.sleep(5)
    result = f"Task complete for word: {word}"
    print(result)
    return result


@celery_app.task(acks_late=True)
def myhome_get_housing_list():
    client = MyHomeClient()

    async def _async_logic():
        # Call the original async function or logic here
        result = client.get_housing_list()  # Assuming get_housing_list is still sync
        if "response" in result and "header" in result["response"]:
            header = result["response"]["header"]
            if header["resultCode"] == "00":
                items_data = result["response"]["body"]["item"]
                if not isinstance(items_data, list):
                    items_data = [items_data]
                items = [
                    AnnouncementCreate(**item) for item in items_data
                ]  # Use schema from relevant import

                for item in items:
                    downloaded_file = await client.download_pdf_with_playwright(item)
                    if downloaded_file is not None:
                        item.file_path = downloaded_file
                        print(f"PDF 파일 저장됨: {downloaded_file}")
                        # Decide if you want to break or process all
            else:
                print(f"API 호출 실패: {header.get('resultMsg', '알 수 없는 오류')}")
        else:
            print("API 응답 형식이 올바르지 않습니다.")

    # Run the async logic within the sync task
    asyncio.run(_async_logic())


@celery_app.task(acks_late=True)
async def analyze_announcement(
    announcement_id: str, model: str, announcement_type: AnnouncementType
):
    engine = await get_mongodb_engine()
    strategy = get_strategy(announcement_type)

    # Call the core logic, injecting dependencies
    await perform_announcement_analysis(
        announcement_id=announcement_id,
        model=model,
        db_engine=engine,
        analysis_strategy=strategy,
        crud_announcement=crud_announcement,
        crud_llm_output=crud_llm_output,
        analyze_pdf_func=analyze_pdf,
    )


@celery_app.task(acks_late=True)
async def analyze_announcement_for_models(
    models: list[str], announcement_type: AnnouncementType
):
    engine = await get_mongodb_engine()
    anns = await crud_announcement.get_multi(engine)
    llm_outputs = await crud_llm_output.get_multi(engine)

    # Group existing analyses by announcement_id and store the set of models used
    analyses_by_ann_id = defaultdict(set)
    for llm_output in llm_outputs:
        analyses_by_ann_id[llm_output.announcement_id].add(llm_output.model)

    required_models = set(models)

    for ann in anns:
        analyzed_models = analyses_by_ann_id.get(str(ann.id), set())
        missing_models = required_models - analyzed_models

        if missing_models:
            for model_name in missing_models:
                print(
                    f"Queueing analysis for announcement {ann.id} for model: {model_name}"
                )
                perform_announcement_analysis.apply_async(
                    args=[str(ann.id), model_name, announcement_type]
                )


@celery_app.task(acks_late=True)
async def analyze_announcement_layout(announcement_id: str):
    engine = await get_mongodb_engine()
    ann = await crud_announcement.get(engine, {"_id": announcement_id})
    if not ann or not ann.file_path:
        print(f"Announcement {announcement_id} not found or has no file path.")
        return

    pdf_path = ann.file_path
    doc = None  # Initialize doc to None
    try:
        doc = fitz.open(pdf_path)
        if len(doc) == 0:
            print(f"No pages found in PDF {pdf_path}")
            return

        # Get model path and initialize model once
        try:
            model_path = get_layout_model_path()
            model = YOLOv10(model_path)
        except Exception as e:
            print(f"Error initializing layout model: {e}")
            return

        all_blocks = []
        first_page = doc[0]
        page_width = int(first_page.rect.width)
        page_height = int(first_page.rect.height)

        for page_num, page in enumerate(doc):
            try:  # Add try/except block for individual page processing
                pix = page.get_pixmap()
                image = pixmap_to_image(pix)
                # Pass page_num to the parser
                page_blocks = parse_layout_from_image(image, page_num, model)
                # No need to set block.page here anymore as it's done in the parser
                all_blocks.extend(page_blocks)
            except Exception as e:
                print(f"Error processing page {page_num} of {pdf_path}: {e}")
                # Continue to the next page if one fails
                continue

        if not all_blocks:
            print(f"No layout blocks found for announcement {announcement_id}.")

        layout_create = LayoutCreate(
            announcement_id=announcement_id,
            width=page_width,
            height=page_height,
            blocks=all_blocks,
        )

        try:
            await crud_layout.create(engine, obj_in=layout_create)
            print(f"Successfully created layout for announcement {announcement_id}")
        except Exception as e:
            print(f"Error saving announcement layout for {announcement_id}: {e}")
            raise

    except Exception as e:
        print(f"Error during layout analysis for {announcement_id}: {e}")
        raise
    finally:
        if doc:
            doc.close()
            print(f"Closed PDF document for {announcement_id}")
