import pytest
from odmantic import AIOEngine  # Required for engine fixture

from app.models.category import Category
from app.schemas.category import CategoryUpdate  # Required for update test
from app.tests.test_factories import TestDataFactory


@pytest.mark.asyncio
async def test_create_category(
    test_factory: TestDataFactory,
    housing_data_1: dict,  # Assuming you have this fixture or similar
    announcement_filename: str,  # Assuming you have this fixture or similar
) -> None:
    """Test creating a category."""
    announcement = await test_factory.create_announcement(
        housing_data_1, filename=announcement_filename
    )
    category_name = "Test Category"
    category = await test_factory.create_category(
        announcement_id=announcement.id, name=category_name
    )
    assert category.name == category_name
    assert category.announcement_id == announcement.id


@pytest.mark.asyncio
async def test_get_category(
    test_factory: TestDataFactory,
    housing_data_1: dict,
    announcement_filename: str,
) -> None:
    """Test retrieving a category."""
    announcement = await test_factory.create_announcement(
        housing_data_1, filename=announcement_filename
    )
    category_name = "Test Category for Get"
    created_category = await test_factory.create_category(
        announcement_id=announcement.id, name=category_name
    )

    retrieved_category = await test_factory.engine.find_one(
        Category, Category.id == created_category.id
    )

    assert retrieved_category is not None
    assert retrieved_category.id == created_category.id
    assert retrieved_category.name == category_name
    assert retrieved_category.announcement_id == announcement.id


@pytest.mark.asyncio
async def test_delete_category_raises_not_implemented(
    test_factory: TestDataFactory,
    housing_data_1: dict,
    announcement_filename: str,
) -> None:
    """Test that deleting a category via test_factory raises NotImplementedError."""
    announcement = await test_factory.create_announcement(
        housing_data_1, filename=announcement_filename
    )
    category_name = "Test Category for Delete"
    category_to_delete = await test_factory.create_category(
        announcement_id=announcement.id, name=category_name
    )

    with pytest.raises(NotImplementedError):
        await test_factory.delete_category(category_to_delete.id)


@pytest.mark.asyncio
async def test_update_category_raises_not_implemented() -> None:
    """Test that updating a category raises NotImplementedError."""
    with pytest.raises(NotImplementedError):
        CategoryUpdate()


@pytest.mark.asyncio
async def test_delete_many_categories_raises_not_implemented(
    test_factory: TestDataFactory,
    engine: AIOEngine,  # Assuming an 'engine' fixture
    housing_data_1: dict,
    announcement_filename: str,
) -> None:
    """Test that deleting many categories raises NotImplementedError."""
    announcement = await test_factory.create_announcement(
        housing_data_1, filename=announcement_filename
    )
    # Create a category so delete_many has something to act upon
    await test_factory.create_category(
        announcement_id=announcement.id, name="Test Category for Delete Many"
    )

    with pytest.raises(NotImplementedError):
        await test_factory.delete_many_categories(announcement.id)
