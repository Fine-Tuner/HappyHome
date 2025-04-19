import pytest
from odmantic import AIOEngine

from app.crud import announcement as crud_announcement
from app.models.announcement import Announcement
from app.schemas.announcement import AnnouncementCreate


@pytest.mark.asyncio
async def test_create_announcement(engine: AIOEngine, housing_list: list[dict]) -> None:
    announcement_in_list = [AnnouncementCreate(**item) for item in housing_list]
    for announcement_in in announcement_in_list:
        announcement: Announcement = await crud_announcement.create(
            engine, obj_in=announcement_in
        )
        assert announcement.announcement_id == int(announcement_in.pblancId)
