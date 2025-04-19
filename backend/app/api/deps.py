from collections.abc import Generator

from app.core.db import get_mongodb_client, get_mongodb_engine


def db_generator() -> Generator:
    try:
        db = get_mongodb_client()
        yield db
    finally:
        pass


def engine_generator() -> Generator:
    try:
        engine = get_mongodb_engine()
        yield engine
    finally:
        pass
