import pytest
from fastapi.testclient import TestClient

from app.schemas.announcement import (
    AnnouncementDetailResponse,
    AnnouncementListResponse,
)
from app.schemas.user_condition import (
    UserConditionCreate,
    UserConditionRead,
    UserConditionUpdate,
)
from app.tests.test_factories import TestDataFactory


@pytest.mark.asyncio
async def test_get_announcements(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data_1: dict,
    housing_data_2: dict,
):
    # Create test announcements with conditions
    announcement_1, _, _ = await test_factory.create_announcement_with_conditions(
        housing_data_1,
        [{"category": "Test Category 1", "conditions": []}],
    )
    announcement_2, _, _ = await test_factory.create_announcement_with_conditions(
        housing_data_2,
        [{"category": "Test Category 2", "conditions": []}],
    )

    response = client.get("/api/v1/announcements/")
    assert response.status_code == 200
    data = AnnouncementListResponse(**response.json())
    assert len(data.items) == 2
    assert data.totalCount == 2

    announcement_view_1 = await test_factory.get_announcement_view(announcement_1.id)
    assert announcement_view_1.view_count == 0

    announcement_view_2 = await test_factory.get_announcement_view(announcement_2.id)
    assert announcement_view_2.view_count == 0


@pytest.mark.asyncio
async def test_get_announcement(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data_1: dict,
):
    # Create test announcement with conditions
    announcement, _, _ = await test_factory.create_announcement_with_conditions(
        housing_data_1,
        [
            {
                "category": "Test Category 1",
                "conditions": [
                    {
                        "content": "Test Condition 1",
                        "section": "Test Section 1",
                        "page": 1,
                        "bbox": [0.1, 0.1, 0.2, 0.2],
                    }
                ],
            }
        ],
    )
    announcement_view = await test_factory.get_announcement_view(announcement.id)
    assert announcement_view.view_count == 0

    # Get the announcement
    response = client.get(f"/api/v1/announcements/{announcement.id}")
    assert response.status_code == 200
    data = AnnouncementDetailResponse(**response.json())
    assert len(data.annotations) == 1
    assert len(data.categories) == 1
    assert data.pdfUrl == f"/api/v1/announcements/{announcement.id}/pdf"

    announcement_view_updated = await test_factory.get_announcement_view(
        announcement.id
    )
    assert announcement_view_updated.view_count == announcement_view.view_count + 1


@pytest.mark.asyncio
async def test_get_updated_announcement(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data_1: dict,
):
    # Create test announcement with initial conditions
    (
        announcement,
        categories,
        conditions,
    ) = await test_factory.create_announcement_with_conditions(
        housing_data_1,
        [
            {
                "category": "Initial Category",
                "conditions": [
                    {
                        "content": "Initial Condition",
                        "section": "Initial Section",
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
    user_condition_updated = UserConditionRead(**response.json())

    # Update the condition
    update_data = UserConditionUpdate(
        content="Updated Condition Content",
        comment="Updated Comment",
    )

    # Update the user condition
    response = client.put(
        f"/api/v1/conditions/update?user_condition_id={user_condition_updated.id}&announcement_id={announcement.id}",
        json=update_data.model_dump(),
    )
    assert response.status_code == 200

    # Get the announcement and verify updated data
    response = client.get(f"/api/v1/announcements/{announcement.id}")
    assert response.status_code == 200
    data = AnnouncementDetailResponse(**response.json())

    # Verify conditions
    assert len(data.annotations) == 1
    assert data.annotations[0].text == update_data.content
    assert data.annotations[0].comment == update_data.comment

    # Verify categories
    assert len(data.categories) == 1
    assert data.categories[0].name == categories[0].name
