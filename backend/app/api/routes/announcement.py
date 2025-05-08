from datetime import datetime

from fastapi import APIRouter, Depends
from odmantic import AIOEngine

from app.api import deps
from app.crud.announcement import crud_announcement
from app.crud.announcement_view import crud_announcement_view
from app.schemas.announcement import AnnouncementListResponse, AnnouncementRead
from app.schemas.announcement_view import AnnouncementViewCreate, AnnouncementViewUpdate

router = APIRouter(prefix="/announcements", tags=["announcements"])


@router.get("/", response_model=AnnouncementListResponse)
async def get_announcements(engine: AIOEngine = Depends(deps.engine_generator)):
    announcements = await crud_announcement.get_many(engine)
    resp_announcements = []

    for announcement in announcements:
        announcement_view = await crud_announcement_view.get(
            engine, {"announcement_id": announcement.id}
        )

        current_time = datetime.now()

        if announcement_view:
            announcement_view_in = AnnouncementViewUpdate(
                view_count=announcement_view.view_count + 1,
                updated_at=current_time,
            )
            announcement_view = await crud_announcement_view.update(
                engine, db_obj=announcement_view, obj_in=announcement_view_in
            )
        else:
            announcement_view = await crud_announcement_view.create(
                engine,
                AnnouncementViewCreate(announcement_id=announcement.id, view_count=1),
            )

        announcement_read = AnnouncementRead.from_model(
            announcement=announcement,
            announcement_view=announcement_view,
        )

        resp_announcements.append(announcement_read)

    return AnnouncementListResponse(
        items=resp_announcements, totalCount=len(resp_announcements)
    )


@router.get("/{announcement_id}", response_model=AnnouncementRead)
async def get_announcement(
    announcement_id: str, engine: AIOEngine = Depends(deps.engine_generator)
):
    return
