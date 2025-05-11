import asyncio
from datetime import datetime

import pytest

from app.models.user_condition import UserCondition
from app.schemas.user_condition import UserConditionUpdate
from app.tests.test_factories import TestDataFactory


@pytest.mark.asyncio
async def test_create_user_condition(
    test_factory: TestDataFactory,
    housing_data_1: dict,
    announcement_filename: str,
) -> None:
    """Test creating a user condition."""
    announcement = await test_factory.create_announcement(
        housing_data_1, filename=announcement_filename
    )
    user_id = "test_user_crud_01"
    content = "This is a test user condition content."
    bbox = [0.1, 0.2, 0.3, 0.4]
    page = 1
    created_user_condition = await test_factory.create_user_condition(
        announcement_id=str(announcement.id),
        user_id=user_id,
        content=content,
        section=None,
        page=page,
        bbox=bbox,
        comment="Initial comment",
    )

    assert created_user_condition is not None
    assert isinstance(created_user_condition, UserCondition)
    assert str(created_user_condition.announcement_id) == str(announcement.id)
    assert created_user_condition.user_id == user_id
    assert created_user_condition.content == content
    assert created_user_condition.page == page
    assert created_user_condition.bbox == bbox
    assert created_user_condition.comment == "Initial comment"
    assert created_user_condition.is_deleted is False
    assert created_user_condition.id is not None
    assert isinstance(created_user_condition.created_at, datetime)
    assert isinstance(created_user_condition.updated_at, datetime)


@pytest.mark.asyncio
async def test_get_user_condition(
    test_factory: TestDataFactory,
    housing_data_1: dict,
    announcement_filename: str,
) -> None:
    """Test retrieving a user condition by ID."""
    announcement = await test_factory.create_announcement(
        housing_data_1, filename=announcement_filename
    )
    created_user_condition = await test_factory.create_user_condition(
        announcement_id=str(announcement.id),
        user_id="test_user_crud_01",
        content="This is a test user condition content.",
        section="Test Get Section",
        page=1,
        bbox=[0.1, 0.2, 0.3, 0.4],
        comment="For get test",
    )

    retrieved_user_condition = await test_factory.get_user_condition(
        created_user_condition.id
    )
    assert retrieved_user_condition.id == created_user_condition.id
    assert retrieved_user_condition.content == created_user_condition.content
    assert retrieved_user_condition.section == created_user_condition.section
    assert retrieved_user_condition.page == created_user_condition.page
    assert retrieved_user_condition.bbox == created_user_condition.bbox
    assert retrieved_user_condition.comment == created_user_condition.comment
    assert retrieved_user_condition.is_deleted == created_user_condition.is_deleted


@pytest.mark.asyncio
async def test_update_user_condition(
    test_factory: TestDataFactory,
    housing_data_1: dict,
    announcement_filename: str,
) -> None:
    """Test updating a user condition."""
    announcement = await test_factory.create_announcement(
        housing_data_1, filename=announcement_filename
    )
    category = await test_factory.create_category(
        announcement_id=str(announcement.id),
        name="Test Category for Update",
    )

    db_obj = await test_factory.create_user_condition(
        announcement_id=str(announcement.id),
        user_id="test_user_crud_01",
        content="This is a test user condition content.",
        section="Original Section for Update",
        page=1,
        bbox=[0.1, 0.2, 0.3, 0.4],
        comment="Original Comment for Update",
    )

    await asyncio.sleep(0.1)
    original_updated_at = db_obj.updated_at

    update_data = UserConditionUpdate(
        comment="Updated Comment",
        bbox=[0.5, 0.5, 0.6, 0.6],
        category_id=str(category.id),
    )
    updated_user_condition = await test_factory.update_user_condition(
        db_obj=db_obj, obj_in=update_data
    )

    assert updated_user_condition is not None
    assert updated_user_condition.id == db_obj.id
    assert updated_user_condition.comment == update_data.comment
    assert updated_user_condition.bbox == update_data.bbox
    assert str(updated_user_condition.category_id) == str(category.id)
    assert updated_user_condition.content == db_obj.content
    assert updated_user_condition.updated_at is not None
    assert updated_user_condition.updated_at > original_updated_at


@pytest.mark.asyncio
async def test_soft_delete_user_condition(
    test_factory: TestDataFactory,
    housing_data_1: dict,
    announcement_filename: str,
) -> None:
    """Test soft deleting a user condition by setting is_deleted = True."""
    announcement = await test_factory.create_announcement(
        housing_data_1, filename=announcement_filename
    )
    db_obj = await test_factory.create_user_condition(
        announcement_id=str(announcement.id),
        user_id="test_user_crud_01",
        content="This is a test user condition content.",
        section="Section for Soft Delete",
        page=1,
        bbox=[0.1, 0.2, 0.3, 0.4],
        comment="Original for soft delete",
    )
    assert db_obj.is_deleted is False

    await asyncio.sleep(0.1)
    original_updated_at_soft_delete = db_obj.updated_at

    update_data = UserConditionUpdate(is_deleted=True)
    soft_deleted_condition = await test_factory.update_user_condition(
        db_obj=db_obj, obj_in=update_data
    )

    assert soft_deleted_condition is not None
    assert soft_deleted_condition.is_deleted is True
    assert soft_deleted_condition.updated_at > original_updated_at_soft_delete

    retrieved_condition = await test_factory.get_user_condition(db_obj.id)
    assert retrieved_condition is not None
    assert retrieved_condition.is_deleted is True
