import pytest

from app.schemas.category import CategoryCreate
from app.schemas.condition import ConditionCreate, ConditionUpdate
from app.tests.test_factories import TestDataFactory


@pytest.mark.asyncio
async def test_update_condition(
    test_factory: TestDataFactory,
    housing_data: dict,
    announcement_filename: str,
) -> None:
    """Test updating an existing condition."""
    announcement = await test_factory.create_announcement(
        housing_data, filename=announcement_filename
    )
    create_category_in = CategoryCreate(
        announcement_id=announcement.id,
        user_id="test_user_for_condition_crud",
        name="Test Category for Condition CRUD",
        comment="test comment for condition crud",
    )
    category = await test_factory.create_category(create_category_in)
    assert category is not None, "Category creation failed for condition test"

    create_condition_in = ConditionCreate(
        announcement_id=announcement.id,
        category_id=category.id,
        user_id="test_user_for_condition_crud",
        llm_output_id="test_llm_for_update",
        content="Initial content",
        section="Initial section",
        page=1,
        bbox=[[0.1, 0.1, 0.2, 0.2]],
        comment="Initial comment",
        color="#FF0000",
    )
    condition = await test_factory.create_condition(create_condition_in)
    assert condition is not None, "Condition creation failed"

    update_condition_in = ConditionUpdate(
        content="Updated content",
        comment="Updated comment",
        color="#00FF00",
        bbox=[[0.2, 0.2, 0.3, 0.3]],
        is_deleted=False,
    )
    updated_condition = await test_factory.update_condition(
        condition.id, update_condition_in
    )

    assert updated_condition is not None
    assert updated_condition.id == condition.id
    assert updated_condition.content == update_condition_in.content
    assert updated_condition.comment == update_condition_in.comment
    assert updated_condition.color == update_condition_in.color
    assert updated_condition.bbox == update_condition_in.bbox
    assert updated_condition.is_deleted is False
    assert updated_condition.section == create_condition_in.section
    assert updated_condition.page == create_condition_in.page
    assert updated_condition.user_id == create_condition_in.user_id
    assert updated_condition.llm_output_id == create_condition_in.llm_output_id
    assert updated_condition.category_id == category.id


@pytest.mark.asyncio
async def test_delete_condition_raises_not_implemented(
    test_factory: TestDataFactory,
    housing_data: dict,
    announcement_filename: str,
) -> None:
    """Test deleting a condition (soft delete) via factory raises NotImplementedError."""
    announcement = await test_factory.create_announcement(
        housing_data, filename=announcement_filename
    )
    create_category_in = CategoryCreate(
        announcement_id=announcement.id,
        user_id="test_user_for_condition_delete",
        name="Test Category for Condition Delete",
        comment="test comment for condition delete",
    )
    category = await test_factory.create_category(create_category_in)
    assert category is not None, "Category creation failed for condition delete test"

    create_condition_in = ConditionCreate(
        announcement_id=announcement.id,
        category_id=category.id,
        user_id="test_user_for_condition_delete",
        llm_output_id="test_llm_for_delete",
        content="Content to be deleted",
        section="Section to be deleted",
        page=1,
        bbox=[[0.1, 0.1, 0.2, 0.2]],
    )
    condition = await test_factory.create_condition(create_condition_in)
    assert condition is not None, "Condition creation for delete test failed"
    assert condition.is_deleted is False

    with pytest.raises(NotImplementedError):
        await test_factory.delete_condition(condition.id)

    with pytest.raises(NotImplementedError):
        await test_factory.delete_many_conditions(announcement_id=announcement.id)
