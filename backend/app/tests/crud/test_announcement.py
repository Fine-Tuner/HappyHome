import pytest
from odmantic import AIOEngine

from app.crud import crud_announcement
from app.enums import AnnouncementType
from app.models.announcement import Announcement
from app.schemas.announcement import AnnouncementCreate


@pytest.mark.asyncio
async def test_create_announcement(
    engine: AIOEngine, housing_list: list[dict], announcement_filename: str
) -> None:
    announcement_in_list = [
        AnnouncementCreate(
            filename=filename,
            **item,
            type=AnnouncementType.PUBLIC_LEASE,
        )
        for item in housing_list
    ]
    for announcement_in in announcement_in_list:
        announcement: Announcement = await crud_announcement.create(
            engine, obj_in=announcement_in
        )
        assert announcement.announcement_id == int(announcement_in.pblancId)
