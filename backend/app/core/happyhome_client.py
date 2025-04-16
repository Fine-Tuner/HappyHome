import json
import os
import ssl
from datetime import datetime
from urllib.request import urlopen, Request
from urllib.parse import quote_plus, urlencode
from playwright.sync_api import sync_playwright

from app.core.config import settings


class HappyHomeClient:
    BASE_URL = settings.HAPPYHOME_BASE_URL
    ENDPOINT = settings.HAPPYHOME_ENDPOINT
    SERVICE_KEY = os.getenv("HAPPYHOME_API_KEY")
    DOWNLOAD_DIR = settings.HAPPYHOME_DOWNLOAD_DIR

    def __init__(self):
        if not self.SERVICE_KEY:
            raise ValueError("API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.")

        # SSL 컨텍스트 생성
        self.context = ssl.create_default_context()
        self.context.check_hostname = False
        self.context.verify_mode = ssl.CERT_NONE

        # 다운로드 디렉토리 생성
        if not os.path.exists(self.DOWNLOAD_DIR):
            os.makedirs(self.DOWNLOAD_DIR)

        # 처리된 공고 ID를 저장하는 세트
        self.processed_pblancids = set()

    def download_pdf_with_playwright(self, page_url: str, pblancid: str) -> str | None:
        """Playwright를 사용하여 PDF를 다운로드합니다."""
        # 이미 처리된 공고 ID인 경우 스킵
        if pblancid in self.processed_pblancids:
            print(f"이미 처리된 공고 ID입니다: {pblancid}")
            return None

        browser = None
        try:
            playwright = sync_playwright().start()
            # 브라우저 실행
            browser = playwright.chromium.launch(headless=True)
            context = browser.new_context(
                accept_downloads=True, viewport={"width": 1920, "height": 1080}
            )

            # 다운로드 이벤트 설정
            page = context.new_page()

            # 다운로드 경로 설정
            download_path = os.path.abspath(self.DOWNLOAD_DIR)

            # 페이지 이동
            page.goto(page_url, wait_until="networkidle")

            # "공고문" th 태그를 찾고 그 옆의 td > a 태그 클릭
            notice_row = page.get_by_text("공고문").first
            if notice_row:
                # 다운로드 대기를 위한 Promise 생성
                with page.expect_download() as download_info:
                    # a 태그 클릭
                    download_link = page.locator('td:right-of(:text("공고문")) a').first
                    if download_link:
                        download_link.click()

                        # 다운로드 완료 대기
                        download = download_info.value

                        # 파일 저장 (공고 ID를 파일명에 포함)
                        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                        download_path = os.path.join(
                            self.DOWNLOAD_DIR, f"공고문_{pblancid}_{timestamp}.pdf"
                        )
                        download.save_as(download_path)

                        # 처리된 공고 ID 기록
                        self.processed_pblancids.add(pblancid)

                        print(f"PDF 다운로드 완료: {download_path}")
                        return download_path

            return None

        except Exception as e:
            print(f"PDF 다운로드 중 오류 발생: {e}")
            return None
        finally:
            if browser:
                browser.close()
            if "playwright" in locals():
                playwright.stop()

    def get_housing_list(self, page_no: int = 1, num_of_rows: int = 200) -> dict:
        """주택 공고 목록을 가져옵니다."""
        params = {
            "serviceKey": self.SERVICE_KEY,
            "pageNo": str(page_no),
            "numOfRows": str(num_of_rows),
            "brtcCode": "41",  # 경기도 지역 코드
        }

        print("\n=== API 요청 파라미터 ===")
        for key, value in params.items():
            if key == "serviceKey":
                print(f"{key}: [인증키 보안상 생략]")
            else:
                print(f"{key}: {value}")
        print("=====================\n")

        query_string = urlencode(params, quote_via=quote_plus, safe="%")
        url = f"{self.BASE_URL}{self.ENDPOINT}?{query_string}"

        print(f"요청 URL: {url}")

        request = Request(url)
        with urlopen(request, context=self.context) as response:
            response_data = response.read().decode("utf-8")
            print(f"응답 내용: {response_data[:500]}")
            result = json.loads(response_data)

            # item 개수 출력
            if "response" in result and "body" in result["response"]:
                items = result["response"]["body"].get("item", [])
                if not isinstance(items, list):
                    items = [items]
                print(f"\n응답으로 받은 item 개수: {len(items)}개")

            return result

    def format_price(self, price: int) -> str:
        """가격을 보기 좋게 포맷팅합니다."""
        return f"{price:,}원"

    def format_date(self, date_str: str) -> str:
        """날짜를 보기 좋게 포맷팅합니다."""
        if not date_str:
            return "날짜 정보 없음"
        try:
            date = datetime.strptime(date_str, "%Y%m%d")
            return date.strftime("%Y년 %m월 %d일")
        except ValueError:
            return date_str
