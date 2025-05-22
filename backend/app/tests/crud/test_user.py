import pytest
import pytest_asyncio
from odmantic import AIOEngine

from app.crud.user import crud_user
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


@pytest_asyncio.fixture
async def test_user(engine: AIOEngine) -> User:
    user_in = UserCreate(
        google_id="test_google_id_auth",
        email="test@example.com",
        display_name="Test User",
        is_active=True,
        is_superuser=False,
    )
    user = await crud_user.create(engine=engine, obj_in=user_in)
    yield user


@pytest.mark.asyncio
async def test_create_user(engine: AIOEngine):
    user_in = UserCreate(
        google_id="test_google_id_create",
        email="user1@example.com",
        display_name="User One",
        is_active=True,
        is_superuser=False,
    )
    user = await crud_user.create(engine=engine, obj_in=user_in)

    assert user.email == user_in.email
    assert user.display_name == user_in.display_name
    assert user.is_active == user_in.is_active
    assert user.is_superuser == user_in.is_superuser
    assert user.id is not None
    assert user.created_at is not None
    assert user.updated_at is not None


@pytest.mark.asyncio
async def test_get_user_by_email(engine: AIOEngine, test_user: User):
    user = await crud_user.get_by_email(engine=engine, email=test_user.email)

    assert user is not None
    assert user.id == test_user.id
    assert user.email == test_user.email


@pytest.mark.asyncio
async def test_get_user_by_id(engine: AIOEngine, test_user: User):
    user = await crud_user.get(engine, User.id == test_user.id)
    assert user is not None
    assert user.id == test_user.id
    assert user.email == test_user.email


@pytest.mark.asyncio
async def test_update_user(engine: AIOEngine, test_user: User):
    update_data = UserUpdate(
        first_name="UpdatedFirst",
        last_name="UpdatedLast",
        display_name="Updated Display",
        picture="https://example.com/pic.jpg",
        income=50000,
        bookmark_announcement_ids=["ann1", "ann2"],
    )
    updated_user = await crud_user.update(engine, test_user, update_data)
    assert updated_user.first_name == "UpdatedFirst"
    assert updated_user.last_name == "UpdatedLast"
    assert updated_user.display_name == "Updated Display"
    assert updated_user.picture == "https://example.com/pic.jpg"
    assert updated_user.income == 50000
    assert updated_user.bookmark_announcement_ids == ["ann1", "ann2"]
    assert updated_user.updated_at is not None


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
        google_id="test_google_id_inactive",
        email="inactive@example.com",
        display_name="Inactive User",
        is_active=False,
        is_superuser=False,
    )
    inactive_user = await crud_user.create(engine=engine, obj_in=user_in)

    # Try to authenticate
    user = await crud_user.authenticate(engine=engine, email=inactive_user.email)

    assert user is None


@pytest.mark.asyncio
async def test_is_active(engine: AIOEngine, test_user: User):
    assert crud_user.is_active(test_user) is True


@pytest.mark.asyncio
async def test_is_superuser(engine: AIOEngine):
    # Create a superuser
    user_in = UserCreate(
        google_id="test_google_id_admin",
        email="admin@example.com",
        display_name="Admin User",
        is_active=True,
        is_superuser=True,
    )
    superuser = await crud_user.create(engine=engine, obj_in=user_in)

    assert crud_user.is_superuser(superuser) is True


@pytest.mark.asyncio
async def test_is_not_superuser(engine: AIOEngine, test_user: User):
    assert crud_user.is_superuser(test_user) is False
