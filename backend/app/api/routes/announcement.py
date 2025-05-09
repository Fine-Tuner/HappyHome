from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from odmantic import AIOEngine

from app.api import deps
from app.core.config import settings
from app.crud import (
    crud_announcement,
    crud_announcement_view,
    crud_condition,
    crud_field_modification,
)
from app.enums import ModificationTargetType
from app.models.announcement import Announcement
from app.models.announcement_view import AnnouncementView
from app.models.condition import Condition
from app.schemas.announcement import (
    AnnouncementDetailResponse,
    AnnouncementListResponse,
    AnnouncementRead,
)
from app.schemas.announcement_view import AnnouncementViewCreate, AnnouncementViewUpdate
from app.schemas.condition import ConditionRead

router = APIRouter(prefix="/announcements", tags=["announcements"])


@router.get("/", response_model=AnnouncementListResponse)
async def get_announcements(engine: AIOEngine = Depends(deps.engine_generator)):
    announcements = await crud_announcement.get_many(engine)
    resp_announcements = []

    for announcement in announcements:
        announcement_view = await crud_announcement_view.get(
            engine, AnnouncementView.announcement_id == announcement.id
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


@router.get("/{announcement_id}", response_model=AnnouncementDetailResponse)
async def get_announcement(
    announcement_id: str, engine: AIOEngine = Depends(deps.engine_generator)
):
    announcement = await crud_announcement.get(
        engine, Announcement.id == announcement_id
    )
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")

    conditions = await crud_condition.get_many(
        engine, Condition.announcement_id == announcement_id
    )
    modified_conditions = []
    for condition in conditions:
        modified_condition = await crud_field_modification.get_modified_instance(
            engine, condition.id, ModificationTargetType.CONDITION
        )
        modified_conditions.append(modified_condition)

    # Create PDF URL for the response
    pdf_url = None
    if announcement.filename:
        pdf_url = f"/api/v1/announcements/{announcement_id}/pdf"

    return AnnouncementDetailResponse(
        conditions=[
            ConditionRead.from_model(condition) for condition in modified_conditions
        ],
        pdf_url=pdf_url,
    )


@router.get("/{announcement_id}/pdf")
async def get_announcement_pdf(
    announcement_id: str, engine: AIOEngine = Depends(deps.engine_generator)
):
    announcement = await crud_announcement.get(
        engine, Announcement.id == announcement_id
    )
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")

    pdf_path = settings.MYHOME_DATA_DIR / announcement.filename
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="PDF file not found on server")

    return FileResponse(
        path=pdf_path, filename=announcement.filename, media_type="application/pdf"
    )
