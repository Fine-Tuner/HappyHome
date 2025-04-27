# Backend

## Prerequisite

- MongoDB

## Installation

```bash
./scripts/setup.sh
```

## Environment Variables

This project requires certain environment variables to be set. Create a `.env` file in the `backend` directory and add the following:

```
OPENAI_API_KEY="your_openai_api_key_here"
MYHOME_API_KEY="your_myhome_api_key_here"
# Add other necessary environment variables here
```

## Run

```bash
fastapi run --reload app/main.py  # fastapi
./scripts/run_celery.sh  # celery, beat, redis
```

This Python snippet demonstrates fetching housing announcements via `myhome_get_housing_list` and analyzing them with an LLM (e.g., GPT-4.1 Mini) using `extract_announcement_information_for_models`.

```python
from app.tasks import myhome_get_housing_list, extract_announcement_information_for_models

# Fetch housing announcements from MyHome API and store them
engine = get_mongodb_engine()
await myhome_get_housing_list(engine)

# Analyze the fetched announcements using LLM models
await extract_announcement_information_for_models(models=["gpt-4.1-mini"])
```

## Test

```bash
./scripts/test.sh
```

## Format

```bash
./scripts/format.sh
```

## Debug

Visualize analysis result for debug purpose.

**Note:** Run these commands from the `backend` directory.

```bash
python -m tools.visualize_llm_analysis_result --output_dir [output_dir] --announcement_id [announcement_id]
python -m tools.visualize_layout --output_dir [output_dir] [announcement_id]
```

## Tasks

### HappyHome

행복주택 API를 활용한 주택 정보 조회 및 공고문 PDF 다운로드 서비스

### 기능

- 행복주택 공고 목록 조회 (경기도 지역)
- 공고문 PDF 자동 다운로드
- 중복 공고 제외 처리
- 상세 정보 표시 (임대료, 보증금, 위치 등)

실행하면 다음과 같은 작업이 수행됩니다:

1. 경기도 지역의 행복주택 공고 목록을 조회합니다.
2. 각 공고의 상세 정보를 출력합니다.
3. 공고문 PDF를 자동으로 다운로드합니다 (downloads 디렉토리에 저장).
4. 중복된 공고는 자동으로 제외됩니다.

### API 문서

#### 행복주택 공고 목록 조회

- 엔드포인트: `/rsdtRcritNtcList`
- 메서드: GET
- 파라미터:
  - serviceKey: API 인증키 (환경 변수에서 설정)
  - pageNo: 페이지 번호 (기본값: 1)
  - numOfRows: 페이지당 행 수 (기본값: 10)
  - brtcCode: 지역 코드 (41: 경기도)

#### 출력 정보

- 공고명
- 주택명
- 위치
- 공급세대수
- 임대보증금
- 월임대료
- 모집기간
- PDF 다운로드 상태

#### 주의사항

1. PDF 다운로드를 위해 Playwright와 Chromium 브라우저가 필요합니다.
2. 다운로드된 PDF 파일은 `downloads` 디렉토리에 저장됩니다.
3. 파일명 형식: `공고문_[공고ID]_[타임스탬프].pdf`
