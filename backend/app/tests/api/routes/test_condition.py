import pytest
from fastapi.testclient import TestClient

from app.schemas.category import CategoryCreate
from app.schemas.condition import (
    ConditionCreate,
    ConditionCreateRequest,
    ConditionResponse,
    ConditionUpdateRequest,
)
from app.tests.test_factories import TestDataFactory


@pytest.mark.asyncio
async def test_create_user_condition(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    announcement = await test_factory.create_announcement(housing_data)
    category = await test_factory.create_category(
        CategoryCreate(
            announcement_id=announcement.id,
            name="Test Category",
        )
    )

    # the condition is linked to the category
    user_condition_in = ConditionCreateRequest(
        announcement_id=announcement.id,
        category_id=category.id,
        content="Test content",
        page=1,
        bbox=[[0.1, 0.1, 0.2, 0.2]],
        comment="Test comment",
        color="#123456",
    )

    response = await client.post(
        "/api/v1/conditions/create",
        json=user_condition_in.model_dump(),
    )
    assert response.status_code == 200
    data = ConditionResponse(**response.json())
    assert data.text == user_condition_in.content
    assert data.category_id == category.id

    # the condition is not linked to the category
    user_only_condition_in = ConditionCreateRequest(
        announcement_id=announcement.id,
        content="User only content",
        page=2,
        bbox=[[0.2, 0.2, 0.3, 0.3]],
        comment="User only comment",
        color="#654321",
    )

    response = await client.post(
        "/api/v1/conditions/create",
        json=user_only_condition_in.model_dump(),
    )
    assert response.status_code == 200
    data = ConditionResponse(**response.json())
    assert data.text == user_only_condition_in.content
    assert data.category_id is None


@pytest.mark.asyncio
async def test_update_existing_user_condition(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    announcement = await test_factory.create_announcement(housing_data)
    category = await test_factory.create_category(
        CategoryCreate(
            announcement_id=announcement.id,
            name="Update Test Category",
        )
    )

    # This part tests updating a condition that is already user-specific
    user_specific_condition = await test_factory.create_condition(
        ConditionCreate(
            announcement_id=announcement.id,
            category_id=category.id,
            content="User only condition",
            page=1,
            bbox=[[0.1, 0.1, 0.2, 0.2]],
            user_id="test_user_123",  # Explicit user_id
        )
    )
    update_payload = ConditionUpdateRequest(
        id=user_specific_condition.id,
        content="Updated user content for existing user condition",
        comment="Updated user comment for existing",
        color="#00FF00",
        bbox=[[0.5, 0.5, 0.6, 0.6]],
    )

    response = await client.put(
        "/api/v1/conditions/update", json=update_payload.model_dump()
    )
    assert response.status_code == 200
    updated_data = ConditionResponse(**response.json())

    assert (
        updated_data.id == user_specific_condition.id
    )  # Ensure it's the same condition
    assert (
        updated_data.user_id == user_specific_condition.user_id
    )  # Ensure user_id is maintained
    assert (
        updated_data.original_id == user_specific_condition.original_id
    )  # Should be None if not a copy
    assert updated_data.text == update_payload.content
    assert updated_data.comment == update_payload.comment
    assert updated_data.color == update_payload.color
    assert updated_data.position.rects == update_payload.bbox


@pytest.mark.asyncio
async def test_update_original_condition_creates_user_version(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    announcement = await test_factory.create_announcement(housing_data)
    category = await test_factory.create_category(
        CategoryCreate(
            announcement_id=announcement.id,
            name="Original Update Test Category",
        )
    )
    original_condition = await test_factory.create_condition(
        ConditionCreate(
            announcement_id=announcement.id,
            category_id=category.id,
            content="This is an original condition",
            page=1,
            bbox=[[0.3, 0.3, 0.4, 0.4]],
            user_id=None,
        )
    )

    # 2. Prepare an update request targeting the original condition's ID
    update_payload = ConditionUpdateRequest(
        id=original_condition.id,
        content="User's custom version of original",
        comment="User's comment on original",
        color="#0000FF",
        bbox=original_condition.bbox,
    )

    # 3. Call the update endpoint
    response = await client.put(
        "/api/v1/conditions/update", json=update_payload.model_dump()
    )

    # 4. Assertions
    assert response.status_code == 200
    new_user_condition_data = ConditionResponse(**response.json())

    assert new_user_condition_data.id != original_condition.id
    assert new_user_condition_data.original_id == original_condition.id
    assert new_user_condition_data.text == update_payload.content
    assert new_user_condition_data.comment == update_payload.comment
    assert new_user_condition_data.color == update_payload.color
    assert (
        new_user_condition_data.user_id == "123"
    )  # Assert the user_id of the new copy
    assert "User" in new_user_condition_data.authorName


@pytest.mark.asyncio
async def test_delete_user_specific_condition(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    # 1. Create an announcement with an original condition
    announcement = await test_factory.create_announcement(housing_data)
    category = await test_factory.create_category(
        CategoryCreate(
            announcement_id=announcement.id,
            name="Delete Test Category",
        )
    )
    original_condition = await test_factory.create_condition(
        ConditionCreate(
            announcement_id=announcement.id,
            category_id=category.id,
            content="Original for delete user-specific",
            page=1,
            bbox=[[0.1, 0.1, 0.2, 0.2]],
            user_id=None,
        )
    )

    # 2. Create a user-specific condition linked to the original one
    user_specific_condition_in = ConditionCreate(
        announcement_id=announcement.id,
        category_id=category.id,
        original_id=original_condition.id,
        user_id="test_user_for_delete_123",
        content="User version to be deleted",
        page=original_condition.page,
        bbox=original_condition.bbox,
    )
    user_condition_to_delete = await test_factory.create_condition(
        user_specific_condition_in
    )
    assert not user_condition_to_delete.is_deleted

    # 3. Call the delete endpoint using the id of the user-specific condition
    response = await client.delete(
        f"/api/v1/conditions/delete?id={user_condition_to_delete.id}"
    )

    # 4. Assertions
    assert response.status_code == 200
    deleted_response_data = ConditionResponse(**response.json())
    assert deleted_response_data.id == user_condition_to_delete.id
    assert (
        deleted_response_data.user_id == user_specific_condition_in.user_id
    )  # Assert user_id
    assert deleted_response_data.is_deleted is True


@pytest.mark.asyncio
async def test_delete_original_condition_creates_deleted_user_version(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    announcement = await test_factory.create_announcement(housing_data)
    category = await test_factory.create_category(
        CategoryCreate(
            announcement_id=announcement.id,
            name="Delete Original Test Category",
        )
    )
    original_condition = await test_factory.create_condition(
        ConditionCreate(
            announcement_id=announcement.id,
            category_id=category.id,
            content="Original to trigger deleted user version",
            page=1,
            bbox=[[0.2, 0.2, 0.3, 0.3]],
            user_id=None,
        )
    )
    assert original_condition.user_id is None

    # 2. Call the delete endpoint using the id of this original condition
    response = await client.delete(
        f"/api/v1/conditions/delete?id={original_condition.id}"
    )

    # 3. Assertions for the response
    assert response.status_code == 200
    newly_created_deleted_condition_data = ConditionResponse(**response.json())

    # 4. A new condition should be created that is marked as deleted for the user
    assert newly_created_deleted_condition_data.id != original_condition.id
    assert newly_created_deleted_condition_data.original_id == original_condition.id
    assert newly_created_deleted_condition_data.is_deleted is True
    assert (
        newly_created_deleted_condition_data.user_id == "123"
    )  # Assert the user_id of the new copy
