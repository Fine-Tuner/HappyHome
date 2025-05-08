from datetime import datetime

from odmantic import AIOEngine

from app.crud.base import CRUDBase
from app.models.announcement import Announcement
from app.models.announcement_view import AnnouncementView
from app.schemas.announcement import AnnouncementCreate, AnnouncementUpdate


class CRUDAnnouncement(CRUDBase[Announcement, AnnouncementCreate, AnnouncementUpdate]):
    def _prepare_model_for_create(self, obj_in: AnnouncementCreate) -> Announcement:
        def _str_to_date(date_str: str) -> datetime.date:
            if date_str == "":
                return None
            return datetime.strptime(date_str, "%Y%m%d").date()

        return Announcement(
            id=obj_in.pblancId,
            raw_data=obj_in.model_dump(),
            house_serial_number=obj_in.houseSn,
            status_name=obj_in.sttusNm,
            announcement_name=obj_in.pblancNm,
            supply_institution_name=obj_in.suplyInsttNm,
            house_type_name=obj_in.houseTyNm,
            supply_type_name=obj_in.suplyTyNm,
            application_date=_str_to_date(obj_in.rcritPblancDe),
            winners_presentation_date=_str_to_date(obj_in.przwnerPresnatnDe),
            url=obj_in.url,
            housing_block_name=obj_in.hsmpNm,
            province_name=obj_in.brtcNm,
            district_name=obj_in.signguNm,
            full_address=obj_in.fullAdres,
            road_name=obj_in.rnCodeNm,
            heating_method_name=obj_in.heatMthdNm,
            total_household_count=obj_in.totHshldCo,
            total_supply_count=obj_in.sumSuplyCo,
            rent_guarantee=obj_in.rentGtn,
            monthly_rent_charge=obj_in.mtRntchrg,
            begin_date=_str_to_date(obj_in.beginDe),
            end_date=_str_to_date(obj_in.endDe),
            filename=obj_in.filename,
            type=obj_in.type,
        )

    async def delete(self, engine: AIOEngine, id: str) -> Announcement:
        async with engine.transaction():
            await engine.delete(
                AnnouncementView, AnnouncementView.announcement_id == id
            )
            return await super().delete(engine, id)


crud_announcement = CRUDAnnouncement(Announcement)
