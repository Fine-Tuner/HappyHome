import time

from app.core.celery_app import celery_app
from app.core.happyhome_client import HappyHomeClient


@celery_app.task(acks_late=True)
def example_task(word: str) -> str:
    """An example background task that waits 5 seconds and returns a message."""
    print(f"Received task with word: {word}")
    time.sleep(5)
    result = f"Task complete for word: {word}"
    print(result)
    return result


@celery_app.task(acks_late=True)
def happyhome_get_housing_list():
    client = HappyHomeClient()
    try:
        # 주택 공고 목록 가져오기
        print("=== 경기도 행복주택 공고 목록 ===")
        result = client.get_housing_list()

        if "response" in result and "header" in result["response"]:
            header = result["response"]["header"]
            if header["resultCode"] == "00":
                items = result["response"]["body"]["item"]
                if not isinstance(items, list):
                    items = [items]

                for item in items:
                    pblancid = item.get("pblancId")

                    # 이미 처리된 공고 ID는 스킵
                    if pblancid in client.processed_pblancids:
                        continue

                    print(f"\n공고명: {item.get('pblancNm', '정보없음')}")
                    print(f"주택명: {item.get('hsmpNm', '정보없음')}")
                    print(f"위치: {item.get('fullAdres', '정보없음')}")
                    print(f"공급세대수: {item.get('sumSuplyCo', '정보없음')}세대")
                    print(f"임대보증금: {client.format_price(item.get('rentGtn', 0))}")
                    print(f"월임대료: {client.format_price(item.get('mtRntchrg', 0))}")
                    print(
                        f"모집기간: {client.format_date(item.get('beginDe', ''))} ~ {client.format_date(item.get('endDe', ''))}"
                    )

                    # 상세 페이지 URL이 있다면 PDF 다운로드
                    page_url = item.get("pcUrl", "")
                    if page_url:
                        print(f"상세 페이지 URL: {page_url}")
                        downloaded_file = client.download_pdf_with_playwright(
                            page_url, pblancid
                        )
                        if downloaded_file:
                            print(f"PDF 파일 저장됨: {downloaded_file}")

                    print("---")
            else:
                print(f"API 호출 실패: {header.get('resultMsg', '알 수 없는 오류')}")
        else:
            print("API 응답 형식이 올바르지 않습니다.")
            print(f"받은 응답: {result}")

    except Exception as e:
        print(f"처리 중 오류 발생: {e}")
