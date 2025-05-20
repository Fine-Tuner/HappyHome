import pytest
from fastapi.testclient import TestClient

from app.models.announcement import Announcement
from app.schemas.announcement import (
    AnnouncementDetailResponse,
    AnnouncementListRequest,
    AnnouncementListResponse,
)
from app.schemas.category import (
    CategoryCreate,
    CategoryCreateRequest,
    CategoryResponse,
    CategoryUpdateRequest,
)
from app.schemas.condition import (
    ConditionCreate,
    ConditionCreateRequest,
    ConditionResponse,
    ConditionUpdateRequest,
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
    ann1 = await test_factory.create_announcement(data_1)
    cat1_data = CategoryCreate(
        announcement_id=ann1.id, name="Test Category 1", user_id=None
    )
    await test_factory.create_category(cat1_data)

    data_2 = housing_data.copy()
    data_2["pblancId"] = "test_2"
    ann2 = await test_factory.create_announcement(data_2)
    cat2_data = CategoryCreate(
        announcement_id=ann2.id, name="Test Category 2", user_id=None
    )
    await test_factory.create_category(cat2_data)

    list_request_params = AnnouncementListRequest(page=1, limit=10)

    response = await client.get(
        "/api/v1/announcements/",
        params=list_request_params.model_dump(exclude_none=True),
    )
    assert response.status_code == 200
    data = AnnouncementListResponse(**response.json())
    assert len(data.items) == 2
    assert data.totalCount == 2
    for item in data.items:
        assert item.viewCount == 0


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
    housing_data_original_id_updated = housing_data.copy()
    housing_data_original_id_updated["pblancId"] = "original_prov_test"
    housing_data_original_id_updated["brtcNm"] = "서울특별시"
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
    found_names = {item.announcementName for item in data.items}
    assert "Happy Housing Project" in found_names
    assert "Super Happy Place" in found_names


@pytest.mark.asyncio
async def test_get_announcements_sort_by_latest(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    data_1 = housing_data.copy()
    data_1["pblancId"] = "latest_1"
    data_1["rcritPblancDe"] = "20230101"
    data_2 = housing_data.copy()
    data_2["pblancId"] = "latest_2"
    data_2["rcritPblancDe"] = "20230301"
    data_3 = housing_data.copy()
    data_3["pblancId"] = "latest_3"
    data_3["rcritPblancDe"] = "20230201"

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
    assert data.items[0].id == "latest_2"
    assert data.items[1].id == "latest_3"
    assert data.items[2].id == "latest_1"


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
    assert data.items[0].id == "view_2"
    assert data.items[0].viewCount == 10
    assert data.items[1].id == "view_1"
    assert data.items[1].viewCount == 5
    assert data.items[2].id == "view_3"
    assert data.items[2].viewCount == 1


@pytest.mark.asyncio
async def test_get_announcements_sort_by_deadline(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    data_1 = housing_data.copy()
    data_1["pblancId"] = "deadline_1"
    data_1["endDe"] = "20230301"
    data_2 = housing_data.copy()
    data_2["pblancId"] = "deadline_2"
    data_2["endDe"] = "20230101"
    data_3 = housing_data.copy()
    data_3["pblancId"] = "deadline_3"
    data_3["endDe"] = "20230201"

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
    assert data.items[0].id == "deadline_2"
    assert data.items[1].id == "deadline_3"
    assert data.items[2].id == "deadline_1"


@pytest.mark.asyncio
async def test_get_announcements_filter_and_sort(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    data_A1 = housing_data.copy()
    data_A1["pblancId"] = "combo_A1"
    data_A1["brtcNm"] = "ProvinceCombo"
    data_A1["rcritPblancDe"] = "20230115"
    data_A2 = housing_data.copy()
    data_A2["pblancId"] = "combo_A2"
    data_A2["brtcNm"] = "ProvinceCombo"
    data_A2["rcritPblancDe"] = "20230120"
    data_B1 = housing_data.copy()
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
    assert data.items[0].id == "combo_A2"
    assert data.items[1].id == "combo_A1"


@pytest.mark.asyncio
async def test_get_announcement(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    announcement_data = housing_data.copy()
    announcement = await test_factory.create_announcement(announcement_data)

    category_data = CategoryCreate(
        announcement_id=announcement.id, name="Original Category 1", user_id=None
    )
    original_category = await test_factory.create_category(category_data)

    condition_data = ConditionCreate(
        announcement_id=announcement.id,
        category_id=original_category.id,
        content="Original Condition 1",
        section="Original Section 1",
        page=1,
        bbox=[[0.1, 0.1, 0.2, 0.2]],
        color="#FF0000",
        user_id=None,
    )
    original_condition = await test_factory.create_condition(condition_data)

    initial_view_count = announcement.view_count
    assert initial_view_count == 0

    response = await client.get(f"/api/v1/announcements/{announcement.id}")
    assert response.status_code == 200
    data = AnnouncementDetailResponse(**response.json())

    assert len(data.annotations) == 1
    assert data.annotations[0].id == original_condition.id
    assert data.annotations[0].text == original_condition.content
    assert data.annotations[0].color == original_condition.color

    assert len(data.categories) == 1
    assert data.categories[0].id == original_category.id
    assert data.categories[0].name == original_category.name
    assert data.categories[0].original_id is None
    assert data.categories[0].user_id is None

    assert data.pdfUrl == f"/api/v1/announcements/{announcement.id}/pdf"
    assert data.viewCount == initial_view_count + 1

    updated_announcement_in_db = await test_factory.engine.find_one(
        Announcement, Announcement.id == announcement.id
    )
    assert updated_announcement_in_db is not None
    assert updated_announcement_in_db.view_count == initial_view_count + 1


@pytest.mark.asyncio
async def test_get_updated_announcement(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    announcement_data = housing_data.copy()
    announcement = await test_factory.create_announcement(announcement_data)

    original_category_data = CategoryCreate(
        announcement_id=announcement.id, name="Category To Update", user_id=None
    )
    original_category = await test_factory.create_category(original_category_data)

    original_condition_data = ConditionCreate(
        announcement_id=announcement.id,
        category_id=original_category.id,
        content="Condition To Update",
        page=1,
        bbox=[[0.1, 0.1, 0.2, 0.2]],
        color="#111111",
        user_id=None,
    )
    original_condition = await test_factory.create_condition(original_condition_data)

    DEFAULT_USER_ID = "123"

    # 1. User updates the original condition's content and color
    updated_condition_text = "User Updated Condition Content"
    updated_condition_color = "#22FF22"
    condition_update_payload = ConditionUpdateRequest(
        id=original_condition.id,
        content=updated_condition_text,
        comment="User Comment on Condition",
        color=updated_condition_color,
        bbox=[[0.15, 0.15, 0.25, 0.25]],
    )
    response = await client.put(
        "/api/v1/conditions/update",
        json=condition_update_payload.model_dump(exclude_none=True),
    )
    assert response.status_code == 200
    user_version_of_condition = ConditionResponse(**response.json())
    assert user_version_of_condition.original_id == original_condition.id
    assert user_version_of_condition.text == updated_condition_text
    assert user_version_of_condition.color == updated_condition_color
    assert user_version_of_condition.user_id == DEFAULT_USER_ID

    # 2. User updates the original category's name
    updated_category_name = "User Updated Category Name"
    category_update_payload = CategoryUpdateRequest(
        id=original_category.id,
        name=updated_category_name,
        comment="User Comment on Category",
    )
    response = await client.put(
        "/api/v1/categories/update",
        json=category_update_payload.model_dump(exclude_none=True),
    )
    assert response.status_code == 200
    user_version_of_category = CategoryResponse(**response.json())
    assert user_version_of_category.original_id == original_category.id
    assert user_version_of_category.name == updated_category_name
    assert user_version_of_category.user_id == DEFAULT_USER_ID

    # 3. User creates a new condition (not linked to an original)
    new_user_condition_text = "Brand New User Condition"
    new_user_condition_color = "#3333FF"
    new_condition_payload = ConditionCreateRequest(
        announcement_id=announcement.id,
        category_id=user_version_of_category.id,
        content=new_user_condition_text,
        page=2,
        bbox=[[0.3, 0.3, 0.4, 0.4]],
        color=new_user_condition_color,
        comment="This is a new user highlight",
    )
    response = await client.post(
        "/api/v1/conditions/create",
        json=new_condition_payload.model_dump(exclude_none=True),
    )
    assert response.status_code == 200
    newly_created_user_condition = ConditionResponse(**response.json())
    assert newly_created_user_condition.original_id is None
    assert newly_created_user_condition.text == new_user_condition_text
    assert newly_created_user_condition.user_id == DEFAULT_USER_ID

    # 4. User creates a new category (not linked to an original)
    new_user_category_name = "Brand New User Category"
    new_category_payload = CategoryCreateRequest(
        announcement_id=announcement.id,
        name=new_user_category_name,
        comment="User's own category",
    )
    response = await client.post(
        "/api/v1/categories/create",
        json=new_category_payload.model_dump(exclude_none=True),
    )
    assert response.status_code == 200
    newly_created_user_category = CategoryResponse(**response.json())
    assert newly_created_user_category.original_id is None
    assert newly_created_user_category.name == new_user_category_name
    assert newly_created_user_category.user_id == DEFAULT_USER_ID

    # 5. Get the announcement detail and verify all changes
    response = await client.get(f"/api/v1/announcements/{announcement.id}")
    assert response.status_code == 200
    data = AnnouncementDetailResponse(**response.json())

    assert len(data.annotations) == 2
    found_updated_condition = False
    found_new_user_condition = False
    for ann in data.annotations:
        if ann.id == user_version_of_condition.id:
            assert ann.original_id == original_condition.id
            assert ann.text == updated_condition_text
            assert ann.color == updated_condition_color
            assert ann.user_id == DEFAULT_USER_ID
            found_updated_condition = True
        elif ann.id == newly_created_user_condition.id:
            assert ann.original_id is None
            assert ann.text == new_user_condition_text
            assert ann.color == new_user_condition_color
            assert ann.user_id == DEFAULT_USER_ID
            found_new_user_condition = True
    assert found_updated_condition
    assert found_new_user_condition

    assert len(data.categories) == 2
    found_updated_category = False
    found_new_user_category = False
    for cat_resp in data.categories:
        if cat_resp.id == user_version_of_category.id:
            assert cat_resp.original_id == original_category.id
            assert cat_resp.name == updated_category_name
            assert cat_resp.user_id == DEFAULT_USER_ID
            found_updated_category = True
        elif cat_resp.id == newly_created_user_category.id:
            assert cat_resp.original_id is None
            assert cat_resp.name == new_user_category_name
            assert cat_resp.user_id == DEFAULT_USER_ID
            found_new_user_category = True
    assert found_updated_category
    assert found_new_user_category

    assert data.viewCount == 1


@pytest.mark.asyncio
async def test_get_announcements_multi_filter_and_logic(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    data_1 = housing_data.copy()
    data_1["pblancId"] = "multi_1"
    data_1["brtcNm"] = "ProvinceX"
    data_1["signguNm"] = "DistrictY"
    data_1["suplyTyNm"] = "TypeA"
    data_2 = housing_data.copy()
    data_2["pblancId"] = "multi_2"
    data_2["brtcNm"] = "ProvinceX"
    data_2["signguNm"] = "DistrictY"
    data_2["suplyTyNm"] = "TypeB"
    data_3 = housing_data.copy()
    data_3["pblancId"] = "multi_3"
    data_3["brtcNm"] = "ProvinceX"
    data_3["signguNm"] = "DistrictZ"
    data_3["suplyTyNm"] = "TypeA"
    data_4 = housing_data.copy()
    data_4["pblancId"] = "multi_4"
    data_4["brtcNm"] = "ProvinceY"
    data_4["signguNm"] = "DistrictY"
    data_4["suplyTyNm"] = "TypeA"

    await test_factory.create_announcement(data_1)
    await test_factory.create_announcement(data_2)
    await test_factory.create_announcement(data_3)
    await test_factory.create_announcement(data_4)

    req = AnnouncementListRequest(
        page=1,
        limit=10,
        provinceName="ProvinceX",
        districtName="DistrictY",
        supplyTypeName="TypeA",
    )
    response = await client.get(
        "/api/v1/announcements/", params=req.model_dump(exclude_none=True)
    )
    assert response.status_code == 200
    data = AnnouncementListResponse(**response.json())
    assert data.totalCount == 1, (
        f"Expected 1 item, got {data.totalCount}. Response: {response.json()}"
    )
    assert len(data.items) == 1
    assert data.items[0].id == "multi_1"


@pytest.mark.asyncio
async def test_get_announcement_default_color_original_condition(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    announcement_data = housing_data.copy()
    announcement = await test_factory.create_announcement(announcement_data)

    category_data = CategoryCreate(
        announcement_id=announcement.id,
        name="Category For Default Color Test",
        user_id=None,
    )
    original_category = await test_factory.create_category(category_data)

    condition_data_no_color = ConditionCreate(
        announcement_id=announcement.id,
        category_id=original_category.id,
        content="Condition With No Color",
        page=1,
        bbox=[[0.4, 0.4, 0.5, 0.5]],
        color=None,  # Explicitly None
        user_id=None,
    )
    original_condition_no_color = await test_factory.create_condition(
        condition_data_no_color
    )

    DEFAULT_CONDITION_COLOR = "#53A4F3"

    response = await client.get(f"/api/v1/announcements/{announcement.id}")
    assert response.status_code == 200
    data = AnnouncementDetailResponse(**response.json())

    assert len(data.annotations) == 1
    annotation_resp = data.annotations[0]
    assert annotation_resp.id == original_condition_no_color.id
    assert annotation_resp.text == original_condition_no_color.content
    assert annotation_resp.color == DEFAULT_CONDITION_COLOR


@pytest.mark.asyncio
async def test_get_announcement_user_deleted_condition_shows_original(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    announcement_data = housing_data.copy()
    announcement = await test_factory.create_announcement(announcement_data)

    original_category_data = CategoryCreate(
        announcement_id=announcement.id,
        name="Cat for Deleted Condition Test",
        user_id=None,
    )
    original_category = await test_factory.create_category(original_category_data)

    original_condition_data = ConditionCreate(
        announcement_id=announcement.id,
        category_id=original_category.id,
        content="Original Condition That Should Be Hidden",
        page=1,
        bbox=[[0.1, 0.1, 0.2, 0.2]],
        color="#ABCDEF",
        user_id=None,
    )
    original_condition = await test_factory.create_condition(original_condition_data)
    DEFAULT_USER_ID = "123"

    # User "updates" the original condition, creating a user version
    update_payload = ConditionUpdateRequest(
        id=original_condition.id, content="User's Version", color="#123123"
    )
    response = await client.put(
        "/api/v1/conditions/update", json=update_payload.model_dump(exclude_none=True)
    )
    assert response.status_code == 200
    user_version_condition = ConditionResponse(**response.json())
    assert (
        user_version_condition.user_id == DEFAULT_USER_ID
    )  # Ensure it's a user version
    assert (
        user_version_condition.original_id == original_condition.id
    )  # Ensure it's linked

    # User then "deletes" their version
    delete_response = await client.delete(
        f"/api/v1/conditions/delete?id={user_version_condition.id}"
    )
    assert delete_response.status_code == 200
    deleted_user_version_info = ConditionResponse(**delete_response.json())
    assert deleted_user_version_info.is_deleted is True
    assert deleted_user_version_info.id == user_version_condition.id

    # Get announcement detail - the original condition should now be hidden for this user
    response = await client.get(f"/api/v1/announcements/{announcement.id}")
    assert response.status_code == 200
    data = AnnouncementDetailResponse(**response.json())

    # Assert that the annotations list is empty or does not contain the original_condition or its user_version
    assert len(data.annotations) == 0, (
        "Annotations list should be empty as the user deleted their version of the only original condition."
    )


@pytest.mark.asyncio
async def test_get_announcement_user_deleted_category_shows_original(
    client: TestClient,
    test_factory: TestDataFactory,
    housing_data: dict,
):
    announcement_data = housing_data.copy()
    announcement = await test_factory.create_announcement(announcement_data)

    original_category_data = CategoryCreate(
        announcement_id=announcement.id,
        name="Original Category That Should Be Hidden",
        user_id=None,
    )
    original_category = await test_factory.create_category(original_category_data)
    DEFAULT_USER_ID = "123"

    # User "updates" the original category, creating a user version
    update_payload = CategoryUpdateRequest(
        id=original_category.id, name="User's Version of Category"
    )
    response = await client.put(
        "/api/v1/categories/update", json=update_payload.model_dump(exclude_none=True)
    )
    assert response.status_code == 200
    user_version_category = CategoryResponse(**response.json())
    assert (
        user_version_category.user_id == DEFAULT_USER_ID
    )  # Ensure it's a user version
    assert (
        user_version_category.original_id == original_category.id
    )  # Ensure it's linked

    # User then "deletes" their version
    delete_response = await client.delete(
        f"/api/v1/categories/delete?id={user_version_category.id}"
    )
    assert delete_response.status_code == 200
    deleted_user_version_info = CategoryResponse(**delete_response.json())
    assert deleted_user_version_info.is_deleted is True
    assert deleted_user_version_info.id == user_version_category.id

    # Get announcement detail - the original category should now be hidden for this user
    response = await client.get(f"/api/v1/announcements/{announcement.id}")
    assert response.status_code == 200
    data = AnnouncementDetailResponse(**response.json())

    # Assert that the categories list is empty or does not contain the original_category or its user_version
    assert len(data.categories) == 0, (
        "Categories list should be empty as the user deleted their version of the only original category."
    )
