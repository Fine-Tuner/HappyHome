from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from odmantic import AIOEngine

from app.api import deps
from app.core.config import settings
from app.crud import (
    crud_announcement,
    crud_announcement_view,
    crud_category,
    crud_condition,
    crud_user_category,
    crud_user_condition,
)
from app.models.announcement import Announcement
from app.models.announcement_view import AnnouncementView
from app.models.category import Category
from app.models.condition import Condition
from app.models.user_category import UserCategory
from app.models.user_condition import UserCondition
from app.schemas.announcement import (
    AnnouncementDetailResponse,
    AnnouncementListResponse,
    AnnouncementRead,
)
from app.schemas.announcement_view import AnnouncementViewUpdate
from app.schemas.category import CategoryRead
from app.schemas.zotero import ZoteroAnnotation

router = APIRouter(prefix="/announcements", tags=["announcements"])


@router.get("/", response_model=AnnouncementListResponse)
async def get_announcements(engine: AIOEngine = Depends(deps.engine_generator)):
    announcements = await crud_announcement.get_many(engine)
    resp_announcements = []

    for announcement in announcements:
        announcement_view = await crud_announcement_view.get(
            engine, AnnouncementView.announcement_id == announcement.id
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
    announcement_id: str,
    user_id: str = "123",
    engine: AIOEngine = Depends(deps.engine_generator),
):
    announcement = await crud_announcement.get(
        engine, Announcement.id == announcement_id
    )
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")

    announcement_view = await crud_announcement_view.get(
        engine, AnnouncementView.announcement_id == announcement_id
    )
    await crud_announcement_view.update(
        engine,
        db_obj=announcement_view,
        obj_in=AnnouncementViewUpdate(view_count=announcement_view.view_count + 1),
    )

    original_categories = await crud_category.get_many(
        engine, Category.announcement_id == announcement_id
    )
    user_categories = await crud_user_category.get_many(
        engine,
        UserCategory.announcement_id == announcement_id,
        UserCategory.user_id == user_id,
    )
    user_categories_map = {uc.original_id: uc for uc in user_categories}
    response_categories = []
    for original_cat in original_categories:
        user_specific_cat = user_categories_map.get(original_cat.id)
        if user_specific_cat:
            response_categories.append(
                CategoryRead(
                    id=original_cat.id,
                    name=user_specific_cat.name,
                    comment=user_specific_cat.comment,
                )
            )
        else:
            response_categories.append(CategoryRead.from_model(original_cat))

    original_conditions = await crud_condition.get_many(
        engine, Condition.announcement_id == announcement_id
    )
    user_conditions = await crud_user_condition.get_many(
        engine,
        UserCondition.announcement_id == announcement_id,
        UserCondition.user_id == user_id,
    )
    user_conditions_map = {
        uc.original_id: uc for uc in user_conditions if uc.original_id
    }
    user_only_conditions = [uc for uc in user_conditions if not uc.original_id]

    response_zotero_annotations: list[ZoteroAnnotation] = []
    DEFAULT_CONDITION_COLOR = "#53A4F3"

    for original_cond in original_conditions:
        user_specific_cond = user_conditions_map.get(original_cond.id)
        annotation = None
        if user_specific_cond:
            annotation = ZoteroAnnotation.from_user_condition(user_specific_cond)
        else:
            annotation = ZoteroAnnotation.from_condition(
                original_cond, DEFAULT_CONDITION_COLOR
            )

        if annotation:
            response_zotero_annotations.append(annotation)

    for uo_cond in user_only_conditions:
        annotation = ZoteroAnnotation.from_user_condition(uo_cond)
        if annotation:
            response_zotero_annotations.append(annotation)

    pdf_url = f"/api/v1/announcements/{announcement_id}/pdf"

    return AnnouncementDetailResponse(
        annotations=response_zotero_annotations,
        categories=response_categories,
        pdfUrl=pdf_url,
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
