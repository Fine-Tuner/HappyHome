import os
import time
from collections import defaultdict

from odmantic import AIOEngine

from app.core.celery_app import celery_app
from app.core.myhome_client import MyHomeClient
from app.crud import (
    crud_announcement,
    crud_announcement_view,
    crud_condition,
    crud_llm_analysis_result,
)
from app.enums import AnnouncementType
from app.models.announcement import Announcement
from app.pdf_analysis.information_extractor import extract_information
from app.pdf_analysis.strategies.factory import get_strategy
from app.schemas.announcement import AnnouncementCreate
from app.schemas.announcement_view import AnnouncementViewCreate
from app.services.information_extraction_service import perform_information_extraction


@celery_app.task(acks_late=True)
def example_task(word: str) -> str:
    """An example background task that waits 5 seconds and returns a message."""
    print(f"Received task with word: {word}")
    time.sleep(5)
    result = f"Task complete for word: {word}"
    print(result)
    return result


@celery_app.task(acks_late=True)
async def myhome_get_housing_list(engine: AIOEngine):
    client = MyHomeClient()

    result = client.get_housing_list()  # Assuming get_housing_list is still sync
    if "response" in result and "header" in result["response"]:
        header = result["response"]["header"]
        if header["resultCode"] == "00":
            items_data = result["response"]["body"]["item"]
            if not isinstance(items_data, list):
                items_data = [items_data]
            items = [
                AnnouncementCreate(**item, type=AnnouncementType.PUBLIC_LEASE)
                for item in items_data
            ]

            for item in items:
                ann_id = item.pblancId
                ann_in_db = await crud_announcement.get(engine, {"_id": ann_id})
                filename = f"{ann_id}.pdf"
                download_path = client.DOWNLOAD_DIR / filename

                if ann_in_db:
                    print(f"Announcement {ann_id} already exists")
                    continue

                download_path = await client.download_pdf_with_playwright(
                    item, download_path
                )
                if download_path is not None:
                    item.filename = filename
                    try:
                        async with engine.transaction():
                            await crud_announcement.create(engine, item)
                            await crud_announcement_view.create(
                                engine,
                                AnnouncementViewCreate(
                                    announcement_id=ann_id, view_count=0
                                ),
                            )
                    except Exception as e:
                        print(f"Error creating announcement {ann_id}: {e}")
                        os.remove(download_path)
                        continue
                else:
                    print(f"Failed to download PDF for announcement {ann_id}")
        else:
            print(f"API 호출 실패: {header.get('resultMsg', '알 수 없는 오류')}")
    else:
        print("API 응답 형식이 올바르지 않습니다.")


@celery_app.task(acks_late=True)
async def extract_announcement_information(
    engine: AIOEngine, announcement: Announcement, model: str
):
    strategy = get_strategy(announcement.type)

    await perform_information_extraction(
        announcement_id=announcement.id,
        model=model,
        db_engine=engine,
        strategy=strategy,
        crud_announcement=crud_announcement,
        crud_llm_analysis_result=crud_llm_analysis_result,
        crud_condition=crud_condition,
        extract_pdf_func=extract_information,
    )


@celery_app.task(acks_late=True)
async def extract_announcement_information_for_models(
    engine: AIOEngine, models: list[str]
):
    anns = await crud_announcement.get_many(engine)
    llm_outputs = await crud_llm_analysis_result.get_many(engine)

    # Group existing analyses by announcement_id and store the set of models used
    analyses_by_ann_id = defaultdict(set)
    for llm_output in llm_outputs:
        analyses_by_ann_id[llm_output.announcement_id].add(llm_output.model)

    required_models = set(models)

    for ann in anns:
        analyzed_models = analyses_by_ann_id.get(str(ann.id), set())
        missing_models = required_models - analyzed_models
        print(f"Announcement {ann.id} has {len(missing_models)} missing models")

        if missing_models:
            for model_name in missing_models:
                print(
                    f"Queueing analysis for announcement {ann.id} for model: {model_name}"
                )
                await extract_announcement_information(engine, ann, model_name)
