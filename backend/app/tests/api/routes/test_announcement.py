import pytest
from fastapi.testclient import TestClient

from app.models.announcement import Announcement
from app.schemas.announcement import (
    AnnouncementDetailResponse,
    AnnouncementListRequest,
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
    housing_data: dict,
):
    data_1 = housing_data.copy()
    data_1["pblancId"] = "test_1"

    data_2 = housing_data.copy()
    data_2["pblancId"] = "test_2"

    # Create test announcements
    await test_factory.create_announcement_with_conditions(
        data_1,
        [{"category": "Test Category 1", "conditions": []}],
    )
    await test_factory.create_announcement_with_conditions(
        data_2,
        [{"category": "Test Category 2", "conditions": []}],
    )

    list_request_params = AnnouncementListRequest(page=1, limit=10)

    # Make request with page and limit parameters, converting Pydantic model to dict
    response = await client.get(
        "/api/v1/announcements/",
        params=list_request_params.model_dump(exclude_none=True),
    )
    assert response.status_code == 200
    data = AnnouncementListResponse(**response.json())
    assert len(data.items) == 2
    assert data.totalCount == 2
    # Check viewCount from the response items themselves
    for item in data.items:
        assert item.viewCount == 0  # Assuming newly created announcements have 0 views


@pytest.mark.asyncio
async def test_get_announcements_filter_by_province(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    data_1 = housing_data.copy()
    data_1["pblancId"] = "prov_test_1"
    data_1["brtcNm"] = "ProvinceA"
    data_1["fullAdres"] = "ProvinceA, Some City, Some Street 123"

    data_2 = housing_data.copy()
    data_2["pblancId"] = "prov_test_2"
    data_2["brtcNm"] = "ProvinceB"
    data_2["fullAdres"] = "ProvinceB, Other City, Other Street 456"

    await test_factory.create_announcement(data_1)
    await test_factory.create_announcement(data_2)
    # Create an announcement that should NOT be matched by the filter
    housing_data_original_id_updated = housing_data.copy()
    housing_data_original_id_updated["pblancId"] = "original_prov_test"
    housing_data_original_id_updated["brtcNm"] = "서울특별시"  # Original province
    await test_factory.create_announcement(housing_data_original_id_updated)

    req = AnnouncementListRequest(page=1, limit=10, provinceName="ProvinceA")
    response = await client.get(
        "/api/v1/announcements/", params=req.model_dump(exclude_none=True)
    )
    assert response.status_code == 200
    data = AnnouncementListResponse(**response.json())
    assert data.totalCount == 1, (
        f"Expected 1 item, got {data.totalCount}. Response: {response.json()}"
    )
    assert len(data.items) == 1
    assert data.items[0].id == "prov_test_1"
    # The address field in AnnouncementRead is a placeholder "address" or announcement.full_address
    # Let's check the announcementName if brtcNm is part of it, or if full_address was set in data_1
    assert data.items[0].address == data_1["fullAdres"]


@pytest.mark.asyncio
async def test_get_announcements_filter_by_name_contains(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    data_1 = housing_data.copy()
    data_1["pblancId"] = "name_test_1"
    data_1["pblancNm"] = "Happy Housing Project"

    data_2 = housing_data.copy()
    data_2["pblancId"] = "name_test_2"
    data_2["pblancNm"] = "Super Happy Place"

    data_3 = housing_data.copy()
    data_3["pblancId"] = "name_test_3"
    data_3["pblancNm"] = "Old Apartments"

    await test_factory.create_announcement(data_1)
    await test_factory.create_announcement(data_2)
    await test_factory.create_announcement(data_3)

    req = AnnouncementListRequest(page=1, limit=10, announcementName="Happy")
    response = await client.get(
        "/api/v1/announcements/", params=req.model_dump(exclude_none=True)
    )
    assert response.status_code == 200
    data = AnnouncementListResponse(**response.json())
    assert data.totalCount == 2
    assert len(data.items) == 2
    assert data.items[0].announcementName in [
        "Happy Housing Project",
        "Super Happy Place",
    ]
    assert data.items[1].announcementName in [
        "Happy Housing Project",
        "Super Happy Place",
    ]


@pytest.mark.asyncio
async def test_get_announcements_sort_by_latest(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    data_1 = housing_data.copy()
    data_1["pblancId"] = "latest_1"
    data_1["rcritPblancDe"] = "20230101"  # Older

    data_2 = housing_data.copy()
    data_2["pblancId"] = "latest_2"
    data_2["rcritPblancDe"] = "20230301"  # Newer

    data_3 = housing_data.copy()
    data_3["pblancId"] = "latest_3"
    data_3["rcritPblancDe"] = "20230201"  # Middle

    await test_factory.create_announcement(data_1)
    await test_factory.create_announcement(data_2)
    await test_factory.create_announcement(data_3)

    req = AnnouncementListRequest(page=1, limit=10, sortType="latest")
    response = await client.get(
        "/api/v1/announcements/", params=req.model_dump(exclude_none=True)
    )
    assert response.status_code == 200
    data = AnnouncementListResponse(**response.json())
    assert len(data.items) == 3
    assert data.items[0].announcementName == data_2["pblancNm"]
    assert data.items[1].announcementName == data_3["pblancNm"]
    assert data.items[2].announcementName == data_1["pblancNm"]


@pytest.mark.asyncio
async def test_get_announcements_sort_by_view_count(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    ann1_data = housing_data.copy()
    ann1_data["pblancId"] = "view_1"
    ann1 = await test_factory.create_announcement(ann1_data)
    await test_factory.increment_announcement_view_count(ann1.id, times=5)

    ann2_data = housing_data.copy()
    ann2_data["pblancId"] = "view_2"
    ann2 = await test_factory.create_announcement(ann2_data)
    await test_factory.increment_announcement_view_count(ann2.id, times=10)

    ann3_data = housing_data.copy()
    ann3_data["pblancId"] = "view_3"
    ann3 = await test_factory.create_announcement(ann3_data)
    await test_factory.increment_announcement_view_count(ann3.id, times=1)

    req = AnnouncementListRequest(page=1, limit=10, sortType="view")
    response = await client.get(
        "/api/v1/announcements/", params=req.model_dump(exclude_none=True)
    )
    assert response.status_code == 200
    data = AnnouncementListResponse(**response.json())
    assert len(data.items) == 3
    assert data.items[0].announcementName == ann2_data["pblancNm"]
    assert data.items[0].viewCount == 10
    assert data.items[1].announcementName == ann1_data["pblancNm"]
    assert data.items[1].viewCount == 5
    assert data.items[2].announcementName == ann3_data["pblancNm"]
    assert data.items[2].viewCount == 1


@pytest.mark.asyncio
async def test_get_announcements_sort_by_deadline(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    data_1 = housing_data.copy()
    data_1["pblancId"] = "deadline_1"
    data_1["endDe"] = "20230301"  # Furthest deadline

    data_2 = housing_data.copy()
    data_2["pblancId"] = "deadline_2"
    data_2["endDe"] = "20230101"  # Closest deadline

    data_3 = housing_data.copy()
    data_3["pblancId"] = "deadline_3"
    data_3["endDe"] = "20230201"  # Middle deadline

    await test_factory.create_announcement(data_1)
    await test_factory.create_announcement(data_2)
    await test_factory.create_announcement(data_3)

    req = AnnouncementListRequest(page=1, limit=10, sortType="deadline")
    response = await client.get(
        "/api/v1/announcements/", params=req.model_dump(exclude_none=True)
    )
    assert response.status_code == 200
    data = AnnouncementListResponse(**response.json())
    assert len(data.items) == 3
    assert data.items[0].announcementName == data_2["pblancNm"]  # Closest first (asc)
    assert data.items[1].announcementName == data_3["pblancNm"]
    assert data.items[2].announcementName == data_1["pblancNm"]


@pytest.mark.asyncio
async def test_get_announcements_filter_and_sort(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    data_A1 = housing_data.copy()
    data_A1["pblancId"] = "combo_A1"
    data_A1["brtcNm"] = "ProvinceCombo"
    data_A1["rcritPblancDe"] = "20230115"  # Older in ProvinceCombo

    data_A2 = housing_data.copy()
    data_A2["pblancId"] = "combo_A2"
    data_A2["brtcNm"] = "ProvinceCombo"
    data_A2["rcritPblancDe"] = "20230120"  # Newer in ProvinceCombo

    data_B1 = housing_data.copy()  # Different province
    data_B1["pblancId"] = "combo_B1"
    data_B1["brtcNm"] = "OtherProvince"
    data_B1["rcritPblancDe"] = "20230101"

    await test_factory.create_announcement(data_A1)
    await test_factory.create_announcement(data_A2)
    await test_factory.create_announcement(data_B1)

    req = AnnouncementListRequest(
        page=1, limit=10, provinceName="ProvinceCombo", sortType="latest"
    )
    response = await client.get(
        "/api/v1/announcements/", params=req.model_dump(exclude_none=True)
    )
    assert response.status_code == 200
    data = AnnouncementListResponse(**response.json())
    assert data.totalCount == 2
    assert len(data.items) == 2
    assert (
        data.items[0].announcementName == data_A2["pblancNm"]
    )  # Newer of ProvinceCombo
    assert (
        data.items[1].announcementName == data_A1["pblancNm"]
    )  # Older of ProvinceCombo


@pytest.mark.asyncio
async def test_get_announcement(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    # Create test announcement
    announcement, _, _ = await test_factory.create_announcement_with_conditions(
        housing_data,
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
    # Initial view_count is 0 from model default
    initial_view_count = announcement.view_count
    assert initial_view_count == 0

    # Get the announcement via API
    response = await client.get(f"/api/v1/announcements/{announcement.id}")
    assert response.status_code == 200
    data = AnnouncementDetailResponse(**response.json())
    assert len(data.annotations) == 1
    assert len(data.categories) == 1
    assert data.pdfUrl == f"/api/v1/announcements/{announcement.id}/pdf"

    # Verify view_count was incremented in the database
    updated_announcement_in_db = await test_factory.engine.find_one(
        Announcement, Announcement.id == announcement.id
    )
    assert updated_announcement_in_db is not None
    assert updated_announcement_in_db.view_count == initial_view_count + 1

    # Also check the viewCount in the response data (optional, but good practice)
    assert data.viewCount == initial_view_count + 1


@pytest.mark.asyncio
async def test_get_updated_announcement(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    # Create test announcement with initial conditions
    (
        announcement,
        categories,
        conditions,
    ) = await test_factory.create_announcement_with_conditions(
        housing_data,
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

    response = await client.post(
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
    response = await client.put(
        f"/api/v1/conditions/update?user_condition_id={user_condition_updated.id}&announcement_id={announcement.id}",
        json=update_data.model_dump(),
    )
    assert response.status_code == 200

    # Get the announcement and verify updated data
    response = await client.get(f"/api/v1/announcements/{announcement.id}")
    assert response.status_code == 200
    data = AnnouncementDetailResponse(**response.json())

    # Verify conditions
    assert len(data.annotations) == 1
    assert data.annotations[0].text == update_data.content
    assert data.annotations[0].comment == update_data.comment
    assert data.viewCount == 1

    # Verify categories
    assert len(data.categories) == 1
    assert data.categories[0].name == categories[0].name
