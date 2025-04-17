import time
import asyncio

from app.core.celery_app import celery_app
from app.core.myhome_client import MyHomeClient
from app.schemas.announcement import AnnouncementCreate


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
