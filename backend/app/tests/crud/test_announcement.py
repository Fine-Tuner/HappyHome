import pytest

from app.models.announcement import Announcement
from app.tests.test_factories import TestDataFactory


@pytest.mark.asyncio
async def test_create_announcement(
    test_factory: TestDataFactory,
    housing_data: dict,
    announcement_filename: str,
    announcement_page_size: tuple[int, int],
) -> None:
    announcement = await test_factory.create_announcement(
        housing_data, filename=announcement_filename, page_size=announcement_page_size
    )
    assert announcement.id == housing_data["pblancId"]
    assert announcement.view_count == 0
    assert announcement.page_size == announcement_page_size


@pytest.mark.asyncio
async def test_get_announcement(
    test_factory: TestDataFactory,
    housing_data: dict,
    announcement_filename: str,
    announcement_page_size: tuple[int, int],
):
    announcement = await test_factory.create_announcement(
        housing_data, filename=announcement_filename, page_size=announcement_page_size
    )
    assert announcement.view_count == 0

    # Get the announcement
    retrieved = await test_factory.engine.find_one(
        Announcement, Announcement.id == announcement.id
    )

    # Verify the retrieved announcement
    assert retrieved is not None
    assert retrieved.id == announcement.id
    assert retrieved.announcement_name == announcement.announcement_name
    assert retrieved.view_count == 0
    assert retrieved.page_size == announcement_page_size


@pytest.mark.asyncio
async def test_delete_announcement(
    test_factory: TestDataFactory,
    housing_data: dict,
    announcement_filename: str,
    announcement_page_size: tuple[int, int],
):
    announcement = await test_factory.create_announcement(
        housing_data, filename=announcement_filename, page_size=announcement_page_size
    )

    # Delete the announcement
    await test_factory.delete_announcement(announcement.id)

    # Verify the announcement is deleted
    announcement_deleted = await test_factory.engine.find_one(
        Announcement, Announcement.id == announcement.id
    )
    assert announcement_deleted is None
