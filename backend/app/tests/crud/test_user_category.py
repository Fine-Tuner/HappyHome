import asyncio
from datetime import datetime

import pytest

from app.models.user_category import UserCategory
from app.schemas.user_category import UserCategoryUpdate
from app.tests.test_factories import TestDataFactory

pytestmark = pytest.mark.asyncio


async def test_create_user_category(
    test_factory: TestDataFactory,
    housing_data_1: dict,
    announcement_filename: str,
) -> None:
    """Test creating a user category."""
    announcement = await test_factory.create_announcement(
        housing_data_1, filename=announcement_filename
    )
    announcement_id = str(announcement.id)
    user_id = "test_user_id"
    name = "Test User Category"
    comment = "This is a test user category."

    user_category = await test_factory.create_user_category(
        announcement_id=announcement_id,
        user_id=user_id,
        name=name,
        comment=comment,
    )

    assert user_category is not None
    assert isinstance(user_category, UserCategory)
    assert user_category.announcement_id == announcement_id
    assert user_category.user_id == user_id
    assert user_category.name == name
    assert user_category.comment == comment
    assert user_category.original_id is None
    assert user_category.is_deleted is False
    assert user_category.id is not None
    assert isinstance(user_category.created_at, datetime)
    assert isinstance(user_category.updated_at, datetime)


async def test_get_user_category(
    test_factory: TestDataFactory,
    housing_data_1: dict,
    announcement_filename: str,
) -> None:
    """Test retrieving a user category by ID."""
    announcement = await test_factory.create_announcement(
        housing_data_1, filename=announcement_filename
    )
    created_user_category = await test_factory.create_user_category(
        announcement_id=str(announcement.id),
        user_id="test_user_get_01",
        name="Category for Get Test",
        comment="This is a comment for get test",
    )

    retrieved_user_category = await test_factory.get_user_category(
        str(created_user_category.id)
    )
    assert retrieved_user_category is not None
    assert retrieved_user_category.id == created_user_category.id
    assert retrieved_user_category.name == created_user_category.name
    assert retrieved_user_category.comment == created_user_category.comment
    assert retrieved_user_category.is_deleted == created_user_category.is_deleted


async def test_update_user_category(
    test_factory: TestDataFactory,
    housing_data_1: dict,
    announcement_filename: str,
) -> None:
    """Test updating a user category."""
    announcement = await test_factory.create_announcement(
        housing_data_1, filename=announcement_filename
    )
    db_obj = await test_factory.create_user_category(
        announcement_id=str(announcement.id),
        user_id="test_user_update_01",
        name="Original Name for Update",
        comment="Original Comment for Update",
    )

    await asyncio.sleep(0.1)  # Ensure updated_at will be different
    original_updated_at = db_obj.updated_at

    update_data = UserCategoryUpdate(
        name="Updated Category Name",
        comment="Updated Comment",
    )
    updated_user_category = await test_factory.update_user_category(
        db_obj=db_obj, obj_in=update_data
    )

    assert updated_user_category is not None
    assert updated_user_category.id == db_obj.id
    assert updated_user_category.name == update_data.name
    assert updated_user_category.comment == update_data.comment
    assert updated_user_category.user_id == db_obj.user_id  # Should not change
    assert (
        updated_user_category.announcement_id == db_obj.announcement_id
    )  # Should not change
    assert updated_user_category.updated_at is not None
    assert updated_user_category.updated_at > original_updated_at


async def test_soft_delete_user_category(
    test_factory: TestDataFactory,
    housing_data_1: dict,
    announcement_filename: str,
) -> None:
    """Test soft deleting a user category by setting is_deleted = True."""
    announcement = await test_factory.create_announcement(
        housing_data_1, filename=announcement_filename
    )
    db_obj = await test_factory.create_user_category(
        announcement_id=str(announcement.id),
        user_id="test_user_soft_delete_01",
        name="Category for Soft Delete",
        comment="Original for soft delete",
    )
    assert db_obj.is_deleted is False

    await asyncio.sleep(0.1)  # Ensure updated_at will be different
    original_updated_at_soft_delete = db_obj.updated_at

    update_data = UserCategoryUpdate(is_deleted=True)
    soft_deleted_category = await test_factory.update_user_category(
        db_obj=db_obj, obj_in=update_data
    )

    assert soft_deleted_category is not None
    assert soft_deleted_category.is_deleted is True
    assert soft_deleted_category.updated_at > original_updated_at_soft_delete

    # Verify by fetching again
    retrieved_category = await test_factory.get_user_category(str(db_obj.id))
    assert retrieved_category is not None
    assert retrieved_category.is_deleted is True
