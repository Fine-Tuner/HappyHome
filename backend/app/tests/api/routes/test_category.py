import pytest
from fastapi.testclient import TestClient

from app.schemas.category import CategoryCreateRequest, CategoryUpdateRequest
from app.schemas.user_category import UserCategoryCreate, UserCategoryResponse
from app.tests.test_factories import TestDataFactory


@pytest.mark.asyncio
async def test_create_user_category(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    (
        announcement,
        categories,
        _,
    ) = await test_factory.create_announcement_with_conditions(
        housing_data,
        [
            {
                "category": "Test Category",
                "conditions": [],
            }
        ],
    )

    # Test creating a user category for an original category
    user_category_in = CategoryCreateRequest(
        announcement_id=announcement.id,
        name="User Category for Original",
        comment="User comment",
        original_category_id=categories[0].id,
    )
    response = await client.post(
        "/api/v1/categories/create",
        json=user_category_in.model_dump(),
    )
    assert response.status_code == 200
    data = UserCategoryResponse(**response.json())
    assert data.name == user_category_in.name
    assert data.original_id == categories[0].id
    assert data.is_deleted is False

    # Test creating a user-only category
    user_only_category_in = CategoryCreateRequest(
        announcement_id=announcement.id,
        name="User Only Category",
        comment="User only comment",
    )
    response = await client.post(
        "/api/v1/categories/create",
        json=user_only_category_in.model_dump(),
    )
    assert response.status_code == 200
    data = UserCategoryResponse(**response.json())
    assert data.name == user_only_category_in.name
    assert data.original_id is None
    assert data.is_deleted is False


@pytest.mark.asyncio
async def test_update_user_category(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    (
        announcement,
        categories,
        _,
    ) = await test_factory.create_announcement_with_conditions(
        housing_data,
        [
            {
                "category": "Test Category",
                "conditions": [],
            }
        ],
    )

    # Create a user category using the factory (linked to original)
    user_category_in = UserCategoryCreate(
        user_id="123",
        announcement_id=announcement.id,
        name="Original User Category",
        comment="Original comment",
        original_id=categories[0].id,
    )
    user_category = await test_factory.create_user_category(user_category_in)
    # Create a user-only category
    user_only_category_in = UserCategoryCreate(
        user_id="123",
        announcement_id=announcement.id,
        name="User Only Category",
        comment="User only comment",
        original_id=None,
    )
    user_only_category = await test_factory.create_user_category(user_only_category_in)

    # Test updating the user category for original
    update_data = CategoryUpdateRequest(
        user_category_id=user_category.id,
        name="Updated User Category",
        comment="Updated comment",
    )
    response = await client.put(
        "/api/v1/categories/update",
        json=update_data.model_dump(exclude_none=True),
    )
    assert response.status_code == 200
    data = UserCategoryResponse(**response.json())
    assert data.name == update_data.name
    assert data.comment == update_data.comment
    assert data.original_id == categories[0].id

    # Test updating the user-only category
    update_data = CategoryUpdateRequest(
        user_category_id=user_only_category.id,
        name="Updated User Only Category",
        comment="Updated user only comment",
    )
    response = await client.put(
        "/api/v1/categories/update",
        json=update_data.model_dump(exclude_none=True),
    )
    assert response.status_code == 200
    data = UserCategoryResponse(**response.json())
    assert data.name == update_data.name
    assert data.comment == update_data.comment
    assert data.original_id is None

    # Test updating by original_category_id (should create a new user_category)
    update_data = CategoryUpdateRequest(
        original_category_id=categories[0].id,
        name="User Update for Original",
        comment="User comment for original",
    )
    response = await client.put(
        "/api/v1/categories/update",
        json=update_data.model_dump(exclude_none=True),
    )
    assert response.status_code == 200
    data = UserCategoryResponse(**response.json())
    assert data.name == update_data.name
    assert data.comment == update_data.comment
    assert data.original_id == categories[0].id

    # Test error when both user_category_id and original_category_id are provided
    update_data = CategoryUpdateRequest(
        user_category_id=user_category.id,
        original_category_id=categories[0].id,
        name="Should Fail",
        comment="Should Fail",
    )
    response = await client.put(
        "/api/v1/categories/update",
        json=update_data.model_dump(exclude_none=True),
    )
    assert response.status_code == 400
    assert (
        response.json()["detail"]
        == "Cannot provide both user_category_id and original_category_id. Only one should be set."
    )


@pytest.mark.asyncio
async def test_delete_user_category(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    (
        announcement,
        categories,
        _,
    ) = await test_factory.create_announcement_with_conditions(
        housing_data,
        [
            {
                "category": "Test Category",
                "conditions": [],
            }
        ],
    )

    # Create a user category using the factory (linked to original)
    user_category_in = UserCategoryCreate(
        user_id="123",
        announcement_id=announcement.id,
        name="Original User Category",
        comment="Original comment",
        original_id=categories[0].id,
    )
    user_category = await test_factory.create_user_category(user_category_in)
    # Create a user-only category
    user_only_category_in = UserCategoryCreate(
        user_id="123",
        announcement_id=announcement.id,
        name="User Only Category",
        comment="User only comment",
        original_id=None,
    )
    user_only_category = await test_factory.create_user_category(user_only_category_in)

    # Test deleting the user category for original
    response = await client.delete(
        "/api/v1/categories/delete",
        params={"user_category_id": user_category.id},
    )
    assert response.status_code == 200
    data = UserCategoryResponse(**response.json())
    assert data.original_id == categories[0].id
    assert data.id == user_category.id
    assert data.is_deleted is True

    # Test deleting the user-only category
    response = await client.delete(
        "/api/v1/categories/delete",
        params={"user_category_id": user_only_category.id},
    )
    assert response.status_code == 200
    data = UserCategoryResponse(**response.json())
    assert data.original_id is None
    assert data.id == user_only_category.id
    assert data.is_deleted is True

    # Test deleting by original_category_id (should create a new user_category marked as deleted)
    response = await client.delete(
        "/api/v1/categories/delete",
        params={"original_category_id": categories[0].id},
    )
    assert response.status_code == 200
    data = UserCategoryResponse(**response.json())
    assert data.original_id == categories[0].id
    assert data.is_deleted is True
