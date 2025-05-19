import pytest
from fastapi.testclient import TestClient

from app.schemas.condition import ConditionCreateRequest, ConditionUpdateRequest
from app.schemas.user_condition import UserConditionResponse
from app.tests.test_factories import TestDataFactory


@pytest.mark.asyncio
async def test_create_user_condition(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    (
        announcement,
        categories,
        conditions,
    ) = await test_factory.create_announcement_with_conditions(
        housing_data,
        [
            {
                "category": "Test Category",
                "conditions": [
                    {
                        "content": "Test condition",
                        "section": "Test section",
                        "page": 1,
                        "bbox": [[0.1, 0.1, 0.2, 0.2]],
                    }
                ],
            }
        ],
    )

    # Test creating a user condition for an original condition
    user_condition_in = ConditionCreateRequest(
        announcement_id=announcement.id,
        category_id=categories[0].id,
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
    data = UserConditionResponse(**response.json())
    assert data.content == user_condition_in.content
    assert data.category_id == categories[0].id
    assert data.is_deleted is False

    # Test creating a user-only condition
    user_only_condition_in = ConditionCreateRequest(
        announcement_id=announcement.id,
        category_id=categories[0].id,
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
    data = UserConditionResponse(**response.json())
    assert data.content == user_only_condition_in.content
    assert data.is_deleted is False


@pytest.mark.asyncio
async def test_update_user_condition(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    (
        announcement,
        categories,
        conditions,
    ) = await test_factory.create_announcement_with_conditions(
        housing_data,
        [
            {
                "category": "Test Category",
                "conditions": [
                    {
                        "content": "Test condition",
                        "section": "Test section",
                        "page": 1,
                        "bbox": [[0.1, 0.1, 0.2, 0.2]],
                    }
                ],
            }
        ],
    )

    # Create a user condition using the factory
    user_condition = await test_factory.create_user_condition(
        announcement_id=announcement.id,
        category_id=categories[0].id,
        user_id="123",
        original_id=conditions[0].id,
        content="Original content",
        page=1,
        bbox=[[0.1, 0.1, 0.2, 0.2]],
        comment="Original comment",
    )

    # Create a user-only condition using the factory
    user_only_condition = await test_factory.create_user_condition(
        announcement_id=announcement.id,
        category_id=categories[0].id,
        user_id="123",
        content="User only content",
        page=2,
        bbox=[[0.2, 0.2, 0.3, 0.3]],
        comment="User only comment",
    )

    # Test updating the user condition for original
    update_data = ConditionUpdateRequest(
        user_condition_id=user_condition.id,
        category_id=categories[0].id,
        content="Updated content",
        comment="Updated comment",
        color="#abcdef",
    )

    response = await client.put(
        "/api/v1/conditions/update",
        json=update_data.model_dump(exclude_none=True),
    )
    assert response.status_code == 200
    data = UserConditionResponse(**response.json())
    assert data.content == update_data.content
    assert data.comment == update_data.comment
    assert data.color == update_data.color
    assert data.original_id == conditions[0].id

    # Test updating the user-only condition
    update_data = ConditionUpdateRequest(
        user_condition_id=user_only_condition.id,
        content="Updated user only content",
        comment="Updated user only comment",
        color="#fedcba",
    )

    response = await client.put(
        "/api/v1/conditions/update",
        json=update_data.model_dump(exclude_none=True),
    )
    assert response.status_code == 200
    data = UserConditionResponse(**response.json())
    assert data.content == update_data.content
    assert data.comment == update_data.comment
    assert data.color == update_data.color
    assert data.original_id is None

    # Test updating by original_condition_id (should create a new user_condition)
    update_data = ConditionUpdateRequest(
        original_condition_id=conditions[0].id,
        content="User update for original",
        comment="User comment for original",
        color="#112233",
        page=1,
        bbox=[[0.1, 0.1, 0.2, 0.2]],
    )
    response = await client.put(
        "/api/v1/conditions/update",
        json=update_data.model_dump(exclude_none=True),
    )
    assert response.status_code == 200
    data = UserConditionResponse(**response.json())
    assert data.content == update_data.content
    assert data.comment == update_data.comment
    assert data.color == update_data.color
    assert data.original_id == conditions[0].id


@pytest.mark.asyncio
async def test_delete_user_condition(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    (
        announcement,
        categories,
        conditions,
    ) = await test_factory.create_announcement_with_conditions(
        housing_data,
        [
            {
                "category": "Test Category",
                "conditions": [
                    {
                        "content": "Test condition",
                        "section": "Test section",
                        "page": 1,
                        "bbox": [[0.1, 0.1, 0.2, 0.2]],
                    }
                ],
            }
        ],
    )

    # Create a user condition using the factory
    user_condition = await test_factory.create_user_condition(
        announcement_id=announcement.id,
        category_id=categories[0].id,
        user_id="123",
        original_id=conditions[0].id,
        content="Original content",
        page=1,
        bbox=[[0.1, 0.1, 0.2, 0.2]],
        comment="Original comment",
    )

    # Create a user-only condition using the factory
    user_only_condition = await test_factory.create_user_condition(
        announcement_id=announcement.id,
        category_id=categories[0].id,
        user_id="123",
        content="User only content",
        page=2,
        bbox=[[0.2, 0.2, 0.3, 0.3]],
        comment="User only comment",
    )

    # Test deleting the user condition for original
    response = await client.delete(
        "/api/v1/conditions/delete",
        params={"user_condition_id": user_condition.id},
    )
    assert response.status_code == 200
    data = UserConditionResponse(**response.json())
    assert data.original_id == conditions[0].id
    assert data.id == user_condition.id
    assert data.is_deleted is True

    # Test deleting the user-only condition
    response = await client.delete(
        "/api/v1/conditions/delete",
        params={"user_condition_id": user_only_condition.id},
    )
    assert response.status_code == 200
    data = UserConditionResponse(**response.json())
    assert data.original_id is None
    assert data.id == user_only_condition.id
    assert data.is_deleted is True

    # Test deleting by original_condition_id (should create a new user_condition marked as deleted)
    response = await client.delete(
        "/api/v1/conditions/delete",
        params={"original_condition_id": conditions[0].id},
    )
    assert response.status_code == 200
    data = UserConditionResponse(**response.json())
    assert data.original_id == conditions[0].id
    assert data.is_deleted is True
