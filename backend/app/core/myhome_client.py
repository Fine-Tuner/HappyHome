import json
import os
import ssl
from pathlib import Path
from urllib.parse import quote_plus, urlencode
from urllib.request import Request, urlopen

from playwright.async_api import async_playwright

from app.core.config import settings
from app.schemas.announcement import AnnouncementCreate


class MyHomeClient:
    BASE_URL: str = settings.MYHOME_BASE_URL
    ENDPOINT: str = settings.MYHOME_ENDPOINT
    SERVICE_KEY: str | None = os.getenv("MYHOME_API_KEY")
    DOWNLOAD_DIR: Path = settings.MYHOME_DATA_DIR

    def __init__(self):
        if not self.SERVICE_KEY:
            raise ValueError("API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.")

        self.context = ssl.create_default_context()
        self.context.check_hostname = False
        self.context.verify_mode = ssl.CERT_NONE

        if not self.DOWNLOAD_DIR.exists():
            self.DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

    async def download_pdf_with_playwright(
        self, announcement: AnnouncementCreate, download_path: Path
    ) -> str | None:
        if announcement.pcUrl is None:
            return

        browser = None
        playwright = None
        try:
            playwright = await async_playwright().start()
            browser = await playwright.chromium.launch(headless=True)
            context = await browser.new_context(
                accept_downloads=True, viewport={"width": 1920, "height": 1080}
            )

            page = await context.new_page()
            await page.goto(announcement.pcUrl, wait_until="networkidle")

            # "공고문" th 태그를 찾고 그 옆의 td > a 태그 클릭
            notice_row = page.get_by_text("공고문").first
            if notice_row:
                # 다운로드 대기를 위한 Promise 생성
                async with page.expect_download() as download_info:
                    # a 태그 클릭
                    download_link = page.locator('td:right-of(:text("공고문")) a').first
                    if download_link:
                        await download_link.click()

                        # 다운로드 완료 대기
                        download = await download_info.value

                        # 파일 저장 (공고 ID를 파일명에 포함)
                        if not download_path.exists():
                            await download.save_as(download_path)
                            print(f"PDF download completed: {download_path}")
                            return str(download_path)
                        else:
                            print(f"File already exists: {download_path}")
                            return
            return

        except Exception as e:
            print(f"Error occurred during PDF download: {e}")
            return
        finally:
            if browser:
                await browser.close()
            if playwright:
                await playwright.stop()

    def get_housing_list(self, page_no: int = 1, num_of_rows: int = 200) -> dict:
        """Get a list of housing announcements."""
        params = {
            "serviceKey": self.SERVICE_KEY,
            "pageNo": str(page_no),
            "numOfRows": str(num_of_rows),
            "brtcCode": "41",  # 경기도 지역 코드
        }

        print("\n=== API Request Parameters ===")
        for key, value in params.items():
            if key == "serviceKey":
                print(f"{key}: [Security reason for authentication key]")
            else:
                print(f"{key}: {value}")
        print("=====================\n")

        query_string = urlencode(params, quote_via=quote_plus, safe="%")
        url = f"{self.BASE_URL}{self.ENDPOINT}?{query_string}"

        print(f"Request URL: {url}")

        request = Request(url)
        with urlopen(request, context=self.context) as response:
            response_data = response.read().decode("utf-8")
            print(f"Response content: {response_data[:500]}")
            result = json.loads(response_data)

            # item 개수 출력
            if "response" in result and "body" in result["response"]:
                items = result["response"]["body"].get("item", [])
                if not isinstance(items, list):
                    items = [items]
                print(f"\nNumber of items received in the response: {len(items)}")

            return result
