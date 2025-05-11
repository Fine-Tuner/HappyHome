import pytest

from app.models.announcement import Announcement
from app.tests.test_factories import TestDataFactory


@pytest.mark.asyncio
async def test_create_announcement(
    test_factory: TestDataFactory,
    housing_data_1: dict,
    announcement_filename: str,
) -> None:
    announcement = await test_factory.create_announcement(
        housing_data_1, filename=announcement_filename
    )
    assert announcement.id == housing_data_1["pblancId"]

    announcement_view = await test_factory.get_announcement_view(announcement.id)
    assert announcement_view is not None
    assert announcement_view.announcement_id == announcement.id
    assert announcement_view.view_count == 0


@pytest.mark.asyncio
async def test_get_announcement(
    test_factory: TestDataFactory,
    housing_data_1: dict,
    announcement_filename: str,
):
    announcement = await test_factory.create_announcement(
        housing_data_1, filename=announcement_filename
    )
    announcement_view = await test_factory.get_announcement_view(announcement.id)
    assert announcement_view is not None
    assert announcement_view.announcement_id == announcement.id
    assert announcement_view.view_count == 0

    # Get the announcement
    retrieved = await test_factory.engine.find_one(
        Announcement, Announcement.id == announcement.id
    )

    # Verify the retrieved announcement
    assert retrieved is not None
    assert retrieved.id == announcement.id
    assert retrieved.announcement_name == announcement.announcement_name


@pytest.mark.asyncio
async def test_delete_announcement(
    test_factory: TestDataFactory,
    housing_data_1: dict,
    announcement_filename: str,
):
    announcement = await test_factory.create_announcement(
        housing_data_1, filename=announcement_filename
    )

    # Delete the announcement
    await test_factory.delete_announcement(announcement.id)

    # Verify the announcement is deleted
    announcement_deleted = await test_factory.engine.find_one(
        Announcement, Announcement.id == announcement.id
    )
    assert announcement_deleted is None

    announcement_view_deleted = await test_factory.get_announcement_view(
        announcement.id
    )
    assert announcement_view_deleted is None
