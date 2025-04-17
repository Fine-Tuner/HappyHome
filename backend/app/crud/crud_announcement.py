from datetime import datetime
from app.crud.base import CRUDBase
from app.models.announcement import Announcement
from app.schemas.announcement import (
    AnnouncementCreate,
    AnnouncementUpdate,
)
from odmantic import AIOEngine


class CRUDAnnouncement(CRUDBase[Announcement, AnnouncementCreate, AnnouncementUpdate]):
    async def create(
        self, engine: AIOEngine, obj_in: AnnouncementCreate
    ) -> Announcement:
        def _str_to_date(date_str: str) -> datetime.date:
            if date_str == "":
                return None
            return datetime.strptime(date_str, "%Y%m%d").date()

        announcement = Announcement(
            announcement_id=int(obj_in.pblancId),
            announcement_name=obj_in.pblancNm,
            housing_name=obj_in.hsmpNm,
            supply_institution_name=obj_in.suplyInsttNm,
            full_address=obj_in.fullAdres,
            total_supply_count=obj_in.sumSuplyCo,
            rent_guarantee=obj_in.rentGtn,
            monthly_rent=obj_in.mtRntchrg,
            pdf_url=obj_in.pcUrl,
            begin_date=_str_to_date(obj_in.beginDe),
            end_date=_str_to_date(obj_in.endDe),
            file_path=obj_in.file_path,
        )
        await engine.save(announcement)
        return announcement


announcement = CRUDAnnouncement(Announcement)
