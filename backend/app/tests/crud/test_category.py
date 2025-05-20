from datetime import datetime, timezone  # Required for type checking

import pytest

from app.schemas.category import CategoryCreate, CategoryUpdate
from app.tests.test_factories import TestDataFactory


@pytest.mark.asyncio
async def test_create_category(
    test_factory: TestDataFactory,
    housing_data: dict,  # Assuming you have this fixture or similar
    announcement_filename: str,  # Assuming you have this fixture or similar
) -> None:
    """Test creating a category."""
    announcement = await test_factory.create_announcement(
        housing_data, filename=announcement_filename
    )
    create_category_in = CategoryCreate(
        announcement_id=announcement.id,
        name="Test Category",
        original_id="orig_cat_123",
        user_id="user_test_abc",
        comment="This is a test comment.",
    )
    category = await test_factory.create_category(
        category_in=create_category_in,
    )
    assert category.name == create_category_in.name
    assert category.announcement_id == announcement.id
    assert category.original_id == create_category_in.original_id
    assert category.user_id == create_category_in.user_id
    assert category.comment == create_category_in.comment
    assert category.is_deleted is False  # Default value
    assert isinstance(category.created_at, datetime)
    assert isinstance(category.updated_at, datetime)


@pytest.mark.asyncio
async def test_get_category(
    test_factory: TestDataFactory,
    housing_data: dict,
    announcement_filename: str,
) -> None:
    """Test retrieving a category."""
    announcement = await test_factory.create_announcement(
        housing_data, filename=announcement_filename
    )
    create_category_in = CategoryCreate(
        announcement_id=announcement.id,
        name="Test Category for Get",
        original_id="orig_get_456",
        user_id="user_get_def",
        comment="Another test comment for get.",
    )
    created_category = await test_factory.create_category(
        category_in=create_category_in,
    )

    retrieved_category = await test_factory.get_category(
        id=created_category.id,
    )

    assert retrieved_category is not None
    assert retrieved_category.id == created_category.id
    assert retrieved_category.name == create_category_in.name
    assert retrieved_category.announcement_id == announcement.id
    assert retrieved_category.original_id == create_category_in.original_id
    assert retrieved_category.user_id == create_category_in.user_id
    assert retrieved_category.comment == create_category_in.comment
    assert retrieved_category.is_deleted == created_category.is_deleted
    assert isinstance(retrieved_category.created_at, datetime)
    assert isinstance(retrieved_category.updated_at, datetime)
    assert (
        retrieved_category.created_at.replace(tzinfo=timezone.utc)
        == created_category.created_at
    )
    assert (
        retrieved_category.updated_at.replace(tzinfo=timezone.utc)
        == created_category.updated_at
    )


@pytest.mark.asyncio
async def test_update_category(
    test_factory: TestDataFactory,
    housing_data: dict,
    announcement_filename: str,
) -> None:
    """Test updating a category."""
    announcement = await test_factory.create_announcement(
        housing_data, filename=announcement_filename
    )
    create_category_in = CategoryCreate(
        announcement_id=announcement.id,
        name="Test Category for Update",
    )
    created_category = await test_factory.create_category(
        category_in=create_category_in,
    )
    update_category_in = CategoryUpdate(
        name="Updated Name",
        comment="Updated Comment",
        is_deleted=True,
    )
    updated_category = await test_factory.update_category(
        id=created_category.id,
        update_data=update_category_in,
    )
    assert updated_category is not None
    assert updated_category.id == created_category.id
    assert updated_category.name == update_category_in.name
    assert updated_category.comment == update_category_in.comment
    assert updated_category.is_deleted == update_category_in.is_deleted


@pytest.mark.asyncio
async def test_delete_category_raises_not_implemented(
    test_factory: TestDataFactory,
    housing_data: dict,
    announcement_filename: str,
) -> None:
    """Test that deleting a category via test_factory raises NotImplementedError."""
    announcement = await test_factory.create_announcement(
        housing_data, filename=announcement_filename
    )
    category_name = "Test Category for Delete"
    create_category_in = CategoryCreate(
        announcement_id=announcement.id,
        name=category_name,
    )
    category_to_delete = await test_factory.create_category(
        category_in=create_category_in,
    )

    with pytest.raises(NotImplementedError):
        await test_factory.delete_category(category_to_delete.id)

    with pytest.raises(NotImplementedError):
        await test_factory.delete_many_categories(announcement.id)
