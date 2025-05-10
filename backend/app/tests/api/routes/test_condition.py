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

    # Test creating a user condition linked to an original condition
    user_condition_in = UserConditionCreate(
        announcement_id=announcement.id,
        user_id="123",
        original_id=conditions[0].id,
        content="Modified test condition",
        section="Modified section",
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
    assert data["content"] == "Modified test condition"
    assert data["comment"] == "Test comment"
    assert data["original_id"] == conditions[0].id

    # Test creating a user-only condition (no original condition)
    user_only_condition_in = UserConditionCreate(
        announcement_id=announcement.id,
        user_id="123",
        content="User only condition",
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
    assert data["content"] == "User only condition"
    assert data["comment"] == "User only comment"
    assert data["original_id"] is None

    # Test creating duplicate user condition (should fail)
    response = client.post(
        f"/api/v1/conditions/create?announcement_id={announcement.id}",
        json=user_condition_in.model_dump(),
    )
    assert response.status_code == 400
    assert "User condition already exists" in response.json()["detail"]


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

    # First create a user condition
    user_condition_in = UserConditionCreate(
        announcement_id=announcement.id,
        user_id="123",
        original_id=conditions[0].id,
        content="Original content",
        section="Original section",
        page=1,
        bbox=[0.1, 0.1, 0.2, 0.2],
        comment="Original comment",
    )

    response = client.post(
        f"/api/v1/conditions/create?announcement_id={announcement.id}",
        json=user_condition_in.model_dump(),
    )
    assert response.status_code == 200

    # Test updating the user condition
    update_data = UserConditionUpdate(
        content="Updated content", comment="Updated comment"
    )

    response = client.put(
        f"/api/v1/conditions/{conditions[0].id}/update?announcement_id={announcement.id}",
        json=update_data.model_dump(),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["content"] == "Updated content"
    assert data["comment"] == "Updated comment"

    # Test updating with non-existent original condition
    response = client.put(
        f"/api/v1/conditions/non_existent_id/update?announcement_id={announcement.id}",
        json=update_data.model_dump(),
    )
    assert response.status_code == 404
    assert "Original condition not found" in response.json()["detail"]

    # Test updating with non-existent announcement
    response = client.put(
        f"/api/v1/conditions/{conditions[0].id}/update?announcement_id=non_existent_announcement",
        json=update_data.model_dump(),
    )
    assert response.status_code == 404
    assert "Original condition not found" in response.json()["detail"]

    # Test updating with non-existent user condition (but valid original condition)
    # First create a new original condition
    new_condition = await test_factory.create_condition(
        announcement.id,
        categories[0].id,
        "New test condition",
        "New section",
        2,
        [0.3, 0.3, 0.4, 0.4],
    )

    response = client.put(
        f"/api/v1/conditions/{new_condition.id}/update?announcement_id={announcement.id}",
        json=update_data.model_dump(),
    )
    assert response.status_code == 404
    assert "User condition not found" in response.json()["detail"]
