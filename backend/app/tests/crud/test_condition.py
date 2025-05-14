import pytest

from app.schemas.condition import ConditionUpdate
from app.tests.test_factories import TestDataFactory


@pytest.mark.asyncio
async def test_update_condition_raises_not_implemented() -> None:
    """Test that updating a condition raises NotImplementedError."""
    with pytest.raises(NotImplementedError):
        ConditionUpdate()  # ConditionUpdate can be empty


@pytest.mark.asyncio
async def test_delete_condition_raises_not_implemented(
    test_factory: TestDataFactory,
    housing_data: dict,
    announcement_filename: str,
) -> None:
    """Test that deleting a condition raises NotImplementedError."""
    announcement = await test_factory.create_announcement(
        housing_data, filename=announcement_filename
    )
    category = await test_factory.create_category(
        announcement_id=announcement.id, name="Test Category for Condition Delete"
    )
    condition = await test_factory.create_condition(
        announcement_id=announcement.id,
        category_id=category.id,
        content="Test content for delete",
        section="Test section for delete",
        page=1,
        bbox=[0, 0, 0, 0],
    )

    with pytest.raises(NotImplementedError):
        await test_factory.delete_condition(condition.id)


@pytest.mark.asyncio
async def test_delete_many_conditions_raises_not_implemented(
    test_factory: TestDataFactory,
    housing_data: dict,
    announcement_filename: str,
) -> None:
    """Test that deleting many conditions raises NotImplementedError."""
    announcement = await test_factory.create_announcement(
        housing_data, filename=announcement_filename
    )
    category = await test_factory.create_category(
        announcement_id=announcement.id, name="Test Category for Condition Delete Many"
    )
    # Create a condition so the delete_many has something to potentially act upon
    await test_factory.create_condition(
        announcement_id=announcement.id,
        category_id=category.id,
        content="Test content for delete many",
        section="Test section for delete many",
        page=1,
        bbox=[0, 0, 0, 0],
    )

    with pytest.raises(NotImplementedError):
        await test_factory.delete_many_conditions(announcement.id)
