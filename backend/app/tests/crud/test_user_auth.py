import pytest
import pytest_asyncio
from odmantic import AIOEngine

from app.crud.user import crud_user
from app.models.user import User
from app.schemas.user import UserCreate


@pytest_asyncio.fixture
async def test_user(engine: AIOEngine) -> User:
    user_in = UserCreate(
        email="test@example.com",
        full_name="Test User",
        is_active=True,
        is_superuser=False,
    )
    user = await crud_user.create(engine=engine, obj_in=user_in)
    yield user
    # Cleanup after the test
    await engine.delete(user)


@pytest.mark.asyncio
async def test_create_user(engine: AIOEngine):
    user_in = UserCreate(
        email="user1@example.com",
        full_name="User One",
        is_active=True,
        is_superuser=False,
    )
    user = await crud_user.create(engine=engine, obj_in=user_in)

    assert user.email == user_in.email
    assert user.full_name == user_in.full_name
    assert user.is_active == user_in.is_active
    assert user.is_superuser == user_in.is_superuser
    assert user.id is not None
    assert user.created_at is not None
    assert user.updated_at is not None

    # Cleanup
    await engine.delete(user)


@pytest.mark.asyncio
async def test_get_user_by_email(engine: AIOEngine, test_user: User):
    user = await crud_user.get_by_email(engine=engine, email=test_user.email)

    assert user is not None
    assert user.id == test_user.id
    assert user.email == test_user.email


@pytest.mark.asyncio
async def test_get_user_by_email_not_found(engine: AIOEngine):
    user = await crud_user.get_by_email(engine=engine, email="nonexistent@example.com")

    assert user is None


@pytest.mark.asyncio
async def test_authenticate_user(engine: AIOEngine, test_user: User):
    user = await crud_user.authenticate(engine=engine, email=test_user.email)

    assert user is not None
    assert user.id == test_user.id
    assert user.email == test_user.email


@pytest.mark.asyncio
async def test_authenticate_nonexistent_user(engine: AIOEngine):
    user = await crud_user.authenticate(engine=engine, email="nonexistent@example.com")

    assert user is None


@pytest.mark.asyncio
async def test_authenticate_inactive_user(engine: AIOEngine):
    # Create an inactive user
    user_in = UserCreate(
        email="inactive@example.com",
        full_name="Inactive User",
        is_active=False,
        is_superuser=False,
    )
    inactive_user = await crud_user.create(engine=engine, obj_in=user_in)

    # Try to authenticate
    user = await crud_user.authenticate(engine=engine, email=inactive_user.email)

    assert user is None

    # Cleanup
    await engine.delete(inactive_user)


@pytest.mark.asyncio
async def test_is_active(engine: AIOEngine, test_user: User):
    assert crud_user.is_active(test_user) is True


@pytest.mark.asyncio
async def test_is_superuser(engine: AIOEngine):
    # Create a superuser
    user_in = UserCreate(
        email="admin@example.com",
        full_name="Admin User",
        is_active=True,
        is_superuser=True,
    )
    superuser = await crud_user.create(engine=engine, obj_in=user_in)

    assert crud_user.is_superuser(superuser) is True

    # Cleanup
    await engine.delete(superuser)


@pytest.mark.asyncio
async def test_is_not_superuser(engine: AIOEngine, test_user: User):
    assert crud_user.is_superuser(test_user) is False
