from datetime import datetime

from odmantic import AIOEngine
from odmantic.query import QueryExpression

from app.crud.announcement_view import crud_announcement_view
from app.crud.base import CRUDBase
from app.models.announcement import Announcement
from app.models.announcement_view import AnnouncementView
from app.schemas.announcement import AnnouncementCreate, AnnouncementUpdate
from app.schemas.announcement_view import AnnouncementViewCreate


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

    async def create(
        self, engine: AIOEngine, obj_in: AnnouncementCreate
    ) -> Announcement:
        async with engine.transaction():
            await crud_announcement_view.create(
                engine,
                AnnouncementViewCreate(announcement_id=obj_in.pblancId, view_count=0),
            )
            return await super().create(engine, obj_in)

    async def delete(
        self, engine: AIOEngine, *queries: QueryExpression | dict | bool
    ) -> None:
        async with engine.transaction():
            obj = await self.get(engine, *queries)
            if obj:
                announcement_id = obj.id
                await engine.delete(obj)
                await crud_announcement_view.delete(
                    engine, AnnouncementView.announcement_id == announcement_id
                )

    async def delete_many(
        self, engine: AIOEngine, *queries: QueryExpression | dict | bool
    ) -> int:
        async with engine.transaction():
            announcements_to_delete = await self.get_many(engine, *queries)
            if not announcements_to_delete:
                return 0

            announcement_ids = [ann.id for ann in announcements_to_delete]

            count_announcement = await super().delete_many(engine, *queries)

            count_announcement_view = 0
            if announcement_ids:
                announcement_view_query = AnnouncementView.announcement_id.in_(
                    announcement_ids
                )
                count_announcement_view = await crud_announcement_view.delete_many(
                    engine, announcement_view_query
                )

            assert count_announcement == count_announcement_view, (
                f"Mismatch in deleted counts. Announcements deleted: {count_announcement}, "
                f"AnnouncementViews deleted: {count_announcement_view}. "
                f"Targeted announcement IDs for view deletion: {announcement_ids}"
            )
            return count_announcement


crud_announcement = CRUDAnnouncement(Announcement)
