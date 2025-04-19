import asyncio
import time
from collections import defaultdict

from app.core.celery_app import celery_app
from app.core.db import get_mongodb_engine
from app.core.myhome_client import MyHomeClient
from app.crud import announcement, announcement_analysis
from app.pdf_analysis.analyzer import analyze_pdf
from app.pdf_analysis.strategies.public_lease import PublicLeaseAnalysisStrategy
from app.schemas.announcement import AnnouncementCreate
from app.services.analysis_service import perform_analysis_logic


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
async def analyze_announcement(announcement_id: str, model: str):
    engine = await get_mongodb_engine()
    strategy = PublicLeaseAnalysisStrategy()

    # Call the core logic, injecting dependencies
    await perform_analysis_logic(
        announcement_id=announcement_id,
        model=model,
        db_engine=engine,
        analysis_strategy=strategy,
        crud_announcement=announcement,
        crud_analysis=announcement_analysis,
        analyze_pdf_func=analyze_pdf,
    )


@celery_app.task(acks_late=True)
async def analyze_announcement_for_models(models: list[str]):
    engine = await get_mongodb_engine()
    anns = await announcement.get_multi(engine)
    anns_analysis = await announcement_analysis.get_multi(engine)

    # Group existing analyses by announcement_id and store the set of models used
    analyses_by_ann_id = defaultdict(set)
    for analysis in anns_analysis:
        analyses_by_ann_id[analysis.announcement_id].add(analysis.model)

    required_models = set(models)

    for ann in anns:
        analyzed_models = analyses_by_ann_id.get(str(ann.id), set())
        missing_models = required_models - analyzed_models

        if missing_models:
            for model_name in missing_models:
                print(
                    f"Queueing analysis for announcement {ann.id} for model: {model_name}"
                )
                analyze_announcement.apply_async(args=[str(ann.id), model_name])
