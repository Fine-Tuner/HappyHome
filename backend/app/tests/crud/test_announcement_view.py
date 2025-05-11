import pytest

from app.schemas.announcement_view import AnnouncementViewUpdate
from app.tests.test_factories import TestDataFactory


@pytest.mark.asyncio
async def test_get_announcement_view(test_factory: TestDataFactory, housing_data_1):
    # Create test announcement and view
    announcement = await test_factory.create_announcement(housing_data_1)

    # Get the view
    view = await test_factory.get_announcement_view(announcement.id)

    # Verify the view
    assert view is not None
    assert view.announcement_id == announcement.id
    assert view.view_count == 0


@pytest.mark.asyncio
async def test_update_announcement_view(test_factory: TestDataFactory, housing_data_1):
    announcement = await test_factory.create_announcement(housing_data_1)

    # Update the view count
    view = await test_factory.get_announcement_view(announcement.id)
    updated_view = await test_factory.update_announcement_view(
        view, AnnouncementViewUpdate(view_count=2)
    )

    assert updated_view.view_count == 2
