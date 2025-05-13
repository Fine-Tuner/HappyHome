import uuid

import pytest
import pytest_asyncio
from httpx import AsyncClient
from httpx._transports.asgi import ASGITransport
from motor.motor_asyncio import AsyncIOMotorClient
from odmantic import AIOEngine

from app.api.deps import engine_generator, get_current_user
from app.core.config import settings
from app.main import app
from app.models.user import User
from app.tests.test_factories import TestDataFactory

# Mock user for authentication override
mock_user_instance = User(
    id="123",  # Align with existing test data user_id if applicable
    google_id="test_google_id_123",
    email="test123@example.com",
    is_active=True,
    is_superuser=False,
)


async def override_get_current_user():
    return mock_user_instance


@pytest_asyncio.fixture
async def mongo_db():
    name = f"test_{uuid.uuid4().hex}"
    # Use settings to configure the test database name
    # Assuming settings.MONGO_DATABASE_URI is the correct connection string
    client = AsyncIOMotorClient(settings.MONGO_DATABASE_URI)
    # Ensure the test database name is used
    db_instance = client[name]
    yield db_instance
    await client.drop_database(name)
    # Clean up the client connection
    client.close()


@pytest_asyncio.fixture
async def engine(mongo_db):
    """Provides an AIOEngine instance connected to the test database."""
    # Pass the existing client and the specific database name to AIOEngine
    # Ensure the parameter name matches AIOEngine constructor ('client' or 'motor_client')
    # Based on your edit, it seems 'client' is correct for your odmantic version
    engine_instance = AIOEngine(client=mongo_db.client, database=mongo_db.name)
    return engine_instance


@pytest.fixture
def test_app(engine):  # Depend on the new engine fixture
    # Use the injected engine fixture
    app.dependency_overrides[engine_generator] = lambda: engine
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield app
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def client(test_app):
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def test_factory(engine):  # Depend on the new engine fixture
    # Use the injected engine fixture
    factory = TestDataFactory(engine)
    yield factory
    # The factory's cleanup method likely handles data within the test database
    await factory.cleanup()


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
