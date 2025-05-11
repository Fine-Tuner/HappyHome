import asyncio
from collections.abc import Generator

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from odmantic import AIOEngine

from app.core.config import settings
from app.core.db import _MongoClientSingleton, get_mongodb_client, get_mongodb_engine
from app.main import app
from app.tests.test_factories import TestDataFactory

TEST_MONGO_DATABASE = "test"
settings.MONGO_DATABASE = TEST_MONGO_DATABASE


@pytest.fixture(scope="session")
def event_loop():
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def db() -> Generator:
    db = get_mongodb_client()
    _MongoClientSingleton._instance.mongo_client.get_io_loop = asyncio.get_event_loop
    yield db
    await db.client.drop_database(TEST_MONGO_DATABASE)


@pytest_asyncio.fixture(scope="session")
async def engine() -> Generator:
    yield get_mongodb_engine()


@pytest.fixture(scope="session")
def client(db) -> Generator:
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session")
def housing_data_1():
    return {
        "pblancId": "test123",
        "houseSn": 123,
        "sttusNm": "접수중",
        "pblancNm": "테스트 공고 1",
        "suplyInsttNm": "서울주택도시공사",
        "houseTyNm": "아파트",
        "suplyTyNm": "공공임대",
        "beforePblancId": "",
        "rcritPblancDe": "20240301",
        "przwnerPresnatnDe": "20240315",
        "suplyHoCo": "100",
        "refrnc": "서울시 강남구",
        "url": "http://test.com/1",
        "pcUrl": "http://test.com/pc/1",
        "mobileUrl": "http://test.com/mobile/1",
        "hsmpNm": "강남 테스트 단지",
        "brtcNm": "서울특별시",
        "signguNm": "강남구",
        "fullAdres": "서울특별시 강남구 테스트로 123",
        "rnCodeNm": "테스트로",
        "refrnLegaldongNm": "테스트동",
        "pnu": "1168010100",
        "heatMthdNm": "지역난방",
        "totHshldCo": 100,
        "sumSuplyCo": 50,
        "rentGtn": 10000000,
        "enty": 5000000,
        "prtpay": 3000000,
        "surlus": 2000000,
        "mtRntchrg": 500000,
        "beginDe": "20240301",
        "endDe": "20240315",
    }


@pytest.fixture(scope="session")
def housing_data_2():
    return {
        "pblancId": "test456",
        "houseSn": 456,
        "sttusNm": "접수중",
        "pblancNm": "테스트 공고 2",
        "suplyInsttNm": "서울주택도시공사",
        "houseTyNm": "아파트",
        "suplyTyNm": "공공임대",
        "beforePblancId": "",
        "rcritPblancDe": "20240301",
        "przwnerPresnatnDe": "20240315",
        "suplyHoCo": "80",
        "refrnc": "서울시 서초구",
        "url": "http://test.com/2",
        "pcUrl": "http://test.com/pc/2",
        "mobileUrl": "http://test.com/mobile/2",
        "hsmpNm": "서초 테스트 단지",
        "brtcNm": "서울특별시",
        "signguNm": "서초구",
        "fullAdres": "서울특별시 서초구 테스트로 456",
        "rnCodeNm": "테스트로",
        "refrnLegaldongNm": "테스트동",
        "pnu": "1168010200",
        "heatMthdNm": "지역난방",
        "totHshldCo": 80,
        "sumSuplyCo": 40,
        "rentGtn": 8000000,
        "enty": 4000000,
        "prtpay": 2500000,
        "surlus": 1500000,
        "mtRntchrg": 400000,
        "beginDe": "20240301",
        "endDe": "20240315",
    }


@pytest.fixture(scope="session")
def announcement_filename():
    return "00000.pdf"


@pytest_asyncio.fixture
async def test_factory(engine: AIOEngine) -> Generator:
    """Fixture that provides a TestDataFactory instance and ensures cleanup."""
    factory = TestDataFactory(engine)
    yield factory
    await factory.cleanup()
