import pytest
from fastapi.testclient import TestClient

from app.schemas.user_condition import UserConditionCreate, UserConditionUpdate
from app.tests.test_factories import TestDataFactory


@pytest.mark.asyncio
async def test_create_user_condition(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_list: list[dict],
):
    # Create test announcement with conditions
    (
        announcement,
        categories,
        conditions,
    ) = await test_factory.create_announcement_with_conditions(
        housing_list[0],
        [
            {
                "category": "Test Category",
                "conditions": [
                    {
                        "content": "Test condition",
                        "section": "Test section",
                        "page": 1,
                        "bbox": [0.1, 0.1, 0.2, 0.2],
                    }
                ],
            }
        ],
    )

    # Test creating a user condition for an original condition
    user_condition_in = UserConditionCreate(
        announcement_id=announcement.id,
        user_id="123",
        original_id=conditions[0].id,
        content="Test content",
        section="Test section",
        page=1,
        bbox=[0.1, 0.1, 0.2, 0.2],
        comment="Test comment",
    )

    response = client.post(
        f"/api/v1/conditions/create?announcement_id={announcement.id}",
        json=user_condition_in.model_dump(),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["content"] == user_condition_in.content
    assert data["original_id"] == conditions[0].id
    assert data["is_deleted"] is False

    # Test creating a user-only condition
    user_only_condition_in = UserConditionCreate(
        announcement_id=announcement.id,
        user_id="123",
        content="User only content",
        section="User section",
        page=2,
        bbox=[0.2, 0.2, 0.3, 0.3],
        comment="User only comment",
    )

    response = client.post(
        f"/api/v1/conditions/create?announcement_id={announcement.id}",
        json=user_only_condition_in.model_dump(),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["content"] == user_only_condition_in.content
    assert data["original_id"] is None
    assert data["is_deleted"] is False


@pytest.mark.asyncio
async def test_update_user_condition(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_list: list[dict],
):
    # Create test announcement with conditions
    (
        announcement,
        categories,
        conditions,
    ) = await test_factory.create_announcement_with_conditions(
        housing_list[0],
        [
            {
                "category": "Test Category",
                "conditions": [
                    {
                        "content": "Test condition",
                        "section": "Test section",
                        "page": 1,
                        "bbox": [0.1, 0.1, 0.2, 0.2],
                    }
                ],
            }
        ],
    )

    # Create a user condition using the factory
    user_condition = await test_factory.create_user_condition(
        announcement_id=announcement.id,
        user_id="123",
        original_id=conditions[0].id,
        content="Original content",
        section="Original section",
        page=1,
        bbox=[0.1, 0.1, 0.2, 0.2],
        comment="Original comment",
    )

    # Create a user-only condition using the factory
    user_only_condition = await test_factory.create_user_condition(
        announcement_id=announcement.id,
        user_id="123",
        content="User only content",
        section="User section",
        page=2,
        bbox=[0.2, 0.2, 0.3, 0.3],
        comment="User only comment",
    )

    # Test updating the user condition for original
    update_data = UserConditionUpdate(
        content="Updated content", comment="Updated comment"
    )

    response = client.put(
        f"/api/v1/conditions/update?user_condition_id={user_condition.id}&announcement_id={announcement.id}",
        json=update_data.model_dump(),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["content"] == update_data.content
    assert data["comment"] == update_data.comment
    assert data["original_id"] == conditions[0].id

    # Test updating the user-only condition
    update_data = UserConditionUpdate(
        content="Updated user only content", comment="Updated user only comment"
    )

    response = client.put(
        f"/api/v1/conditions/update?user_condition_id={user_only_condition.id}&announcement_id={announcement.id}",
        json=update_data.model_dump(),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["content"] == update_data.content
    assert data["comment"] == update_data.comment
    assert data["original_id"] is None


@pytest.mark.asyncio
async def test_delete_user_condition(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_list: list[dict],
):
    # Create test announcement with conditions
    (
        announcement,
        categories,
        conditions,
    ) = await test_factory.create_announcement_with_conditions(
        housing_list[0],
        [
            {
                "category": "Test Category",
                "conditions": [
                    {
                        "content": "Test condition",
                        "section": "Test section",
                        "page": 1,
                        "bbox": [0.1, 0.1, 0.2, 0.2],
                    }
                ],
            }
        ],
    )

    # Create a user condition using the factory
    user_condition = await test_factory.create_user_condition(
        announcement_id=announcement.id,
        user_id="123",
        original_id=conditions[0].id,
        content="Original content",
        section="Original section",
        page=1,
        bbox=[0.1, 0.1, 0.2, 0.2],
        comment="Original comment",
    )

    # Create a user-only condition using the factory
    user_only_condition = await test_factory.create_user_condition(
        announcement_id=announcement.id,
        user_id="123",
        content="User only content",
        section="User section",
        page=2,
        bbox=[0.2, 0.2, 0.3, 0.3],
        comment="User only comment",
    )

    # Test deleting the user condition for original
    response = client.delete(
        f"/api/v1/conditions/delete?user_condition_id={user_condition.id}&announcement_id={announcement.id}"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_deleted"] is True

    # Test deleting the user-only condition
    response = client.delete(
        f"/api/v1/conditions/delete?user_condition_id={user_only_condition.id}&announcement_id={announcement.id}"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_deleted"] is True
