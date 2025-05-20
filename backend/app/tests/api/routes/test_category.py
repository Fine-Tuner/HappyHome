import pytest
from fastapi.testclient import TestClient

from app.schemas.category import (
    CategoryCreate,
    CategoryCreateRequest,
    CategoryResponse,
    CategoryUpdateRequest,
)
from app.tests.test_factories import TestDataFactory


@pytest.mark.asyncio
async def test_create_user_category(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    announcement = await test_factory.create_announcement(housing_data)

    create_category_in = CategoryCreateRequest(
        announcement_id=announcement.id,
        name="User Category",
        comment="User comment",
    )
    response = await client.post(
        "/api/v1/categories/create",
        json=create_category_in.model_dump(),
    )
    assert response.status_code == 200
    data = CategoryResponse(**response.json())
    assert data.name == create_category_in.name
    assert data.comment == create_category_in.comment
    assert data.original_id is None
    assert data.user_id == "123"  # Assuming "123" is the default test user_id
    assert data.is_deleted is False


@pytest.mark.asyncio
async def test_update_original_category_creates_user_version(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    announcement = await test_factory.create_announcement(housing_data)
    original_category = await test_factory.create_category(
        CategoryCreate(
            announcement_id=announcement.id,
            name="Original Category Name",
            user_id=None,  # Ensure it's an original category
        )
    )

    update_payload = CategoryUpdateRequest(
        id=original_category.id,
        name="User's Updated Name for Original",
        comment="User's comment on original",
    )

    response = await client.put(
        "/api/v1/categories/update",
        json=update_payload.model_dump(exclude_none=True),
    )
    assert response.status_code == 200
    new_user_category_data = CategoryResponse(**response.json())

    assert new_user_category_data.id != original_category.id
    assert new_user_category_data.original_id == original_category.id
    assert new_user_category_data.name == update_payload.name
    assert new_user_category_data.comment == update_payload.comment
    assert new_user_category_data.user_id == "123"
    assert new_user_category_data.is_deleted is False


@pytest.mark.asyncio
async def test_update_existing_user_category(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    announcement = await test_factory.create_announcement(housing_data)
    # Create a user-specific category first
    user_category_to_update = await test_factory.create_category(
        CategoryCreate(
            announcement_id=announcement.id,
            name="Initial User Category Name",
            user_id="test_user_abc",  # Explicit user_id
            comment="Initial comment",
        )
    )

    update_payload = CategoryUpdateRequest(
        id=user_category_to_update.id,
        name="Updated User Category Name",
        comment="Updated comment for user category",
    )

    response = await client.put(
        "/api/v1/categories/update", json=update_payload.model_dump(exclude_none=True)
    )
    assert response.status_code == 200
    updated_data = CategoryResponse(**response.json())

    assert updated_data.id == user_category_to_update.id
    assert updated_data.user_id == user_category_to_update.user_id
    assert (
        updated_data.original_id == user_category_to_update.original_id
    )  # Should be None if not a copy from original
    assert updated_data.name == update_payload.name
    assert updated_data.comment == update_payload.comment
    assert updated_data.is_deleted == user_category_to_update.is_deleted


@pytest.mark.asyncio
async def test_delete_user_specific_category(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    announcement = await test_factory.create_announcement(housing_data)
    # Create a user-specific category to delete
    user_category_to_delete = await test_factory.create_category(
        CategoryCreate(
            announcement_id=announcement.id,
            name="User Category to Delete",
            user_id="test_user_def",  # Explicit user_id
            comment="This will be deleted",
        )
    )
    assert not user_category_to_delete.is_deleted

    response = await client.delete(
        f"/api/v1/categories/delete?id={user_category_to_delete.id}"
    )
    assert response.status_code == 200
    deleted_response_data = CategoryResponse(**response.json())

    assert deleted_response_data.id == user_category_to_delete.id
    assert deleted_response_data.user_id == user_category_to_delete.user_id
    assert deleted_response_data.is_deleted is True
    assert (
        deleted_response_data.name == user_category_to_delete.name
    )  # Name should persist


@pytest.mark.asyncio
async def test_delete_original_category_creates_deleted_user_version(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    announcement = await test_factory.create_announcement(housing_data)
    original_category_to_delete = await test_factory.create_category(
        CategoryCreate(
            announcement_id=announcement.id,
            name="Original Category to be 'deleted'",
            user_id=None,  # Ensure it's an original category
        )
    )
    assert original_category_to_delete.user_id is None

    response = await client.delete(
        f"/api/v1/categories/delete?id={original_category_to_delete.id}"
    )
    assert response.status_code == 200
    newly_created_deleted_category_data = CategoryResponse(**response.json())

    assert newly_created_deleted_category_data.id != original_category_to_delete.id
    assert (
        newly_created_deleted_category_data.original_id
        == original_category_to_delete.id
    )
    assert newly_created_deleted_category_data.user_id == "123"
    assert newly_created_deleted_category_data.is_deleted is True
    assert (
        newly_created_deleted_category_data.name == original_category_to_delete.name
    )  # Name should be copied
