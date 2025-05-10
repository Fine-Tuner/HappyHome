import pytest
from fastapi.testclient import TestClient

from app.crud import crud_announcement
from app.models.announcement_view import AnnouncementView
from app.schemas.announcement import (
    AnnouncementDetailResponse,
    AnnouncementListResponse,
)
from app.schemas.user_condition import UserConditionCreate, UserConditionUpdate
from app.tests.test_factories import TestDataFactory


@pytest.mark.asyncio
async def test_get_announcements(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_list: list[dict],
):
    # Create test announcements with conditions
    announcement_1, _, _ = await test_factory.create_announcement_with_conditions(
        housing_list[0],
        [{"category": "Test Category 1", "conditions": []}],
    )
    announcement_2, _, _ = await test_factory.create_announcement_with_conditions(
        housing_list[1],
        [{"category": "Test Category 2", "conditions": []}],
    )

    # Create announcement views
    await test_factory.create_announcement_view(announcement_1.id)
    await test_factory.create_announcement_view(announcement_2.id)

    response = client.get("/api/v1/announcements/")
    assert response.status_code == 200
    data = AnnouncementListResponse(**response.json())
    assert len(data.items) == 2
    assert data.totalCount == 2

    announcement_view = await test_factory.engine.find_one(
        AnnouncementView, AnnouncementView.announcement_id == announcement_1.id
    )
    assert announcement_view is not None
    assert announcement_view.view_count == 1


@pytest.mark.asyncio
async def test_get_announcement(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_list: list[dict],
):
    announcement = await crud_announcement.get(test_factory.engine)
    # Create test announcement with conditions
    announcement, _, _ = await test_factory.create_announcement_with_conditions(
        housing_list[0],
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

    # Create announcement view
    await test_factory.create_announcement_view(announcement.id)

    # Get the announcement
    response = client.get(f"/api/v1/announcements/{announcement.id}")
    assert response.status_code == 200
    data = AnnouncementDetailResponse(**response.json())
    assert len(data.conditions) == 1
    assert len(data.categories) == 1
    assert data.pdfUrl == f"/api/v1/announcements/{announcement.id}/pdf"


@pytest.mark.asyncio
async def test_get_updated_announcement(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_list: list[dict],
):
    # Create test announcement with initial conditions
    (
        announcement,
        categories,
        conditions,
    ) = await test_factory.create_announcement_with_conditions(
        housing_list[0],
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

    # Create announcement view
    await test_factory.create_announcement_view(announcement.id)

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

    # Update the condition
    update_data = UserConditionUpdate(
        content="Updated Condition Content",
        comment="Updated Comment",
    )

    # Update the user condition
    response = client.put(
        f"/api/v1/conditions/{conditions[0].id}/update?announcement_id={announcement.id}",
        json=update_data.model_dump(),
    )
    assert response.status_code == 200

    # Get the announcement and verify updated data
    response = client.get(f"/api/v1/announcements/{announcement.id}")
    assert response.status_code == 200
    data = AnnouncementDetailResponse(**response.json())

    # Verify conditions
    assert len(data.conditions) == 1
    assert data.conditions[0].text == "Updated Condition Content"
    assert data.conditions[0].comment == "Updated Comment"

    # Verify categories
    assert len(data.categories) == 1
    assert data.categories[0].name == "Initial Category"
