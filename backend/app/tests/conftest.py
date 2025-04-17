import asyncio
import json
from collections.abc import Generator
from pathlib import Path

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.db import _MongoClientSingleton, get_mongodb_client, get_mongodb_engine
from app.main import app

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
def asset_dir():
    return Path(__file__).parent / "assets"


@pytest.fixture(scope="session")
def housing_list(asset_dir):
    with open(asset_dir / "housing_list.json", "r") as f:
        return json.load(f)
