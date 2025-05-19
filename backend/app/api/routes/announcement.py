from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from odmantic import AIOEngine

from app.api import deps
from app.core.config import settings
from app.crud import (
    crud_announcement,
    crud_category,
    crud_condition,
    crud_user_category,
    crud_user_condition,
)
from app.models.announcement import Announcement
from app.models.category import Category
from app.models.condition import Condition
from app.models.user import User
from app.models.user_category import UserCategory
from app.models.user_condition import UserCondition
from app.schemas.announcement import (
    AnnouncementDetailResponse,
    AnnouncementListRequest,
    AnnouncementListResponse,
    AnnouncementRead,
    AnnouncementUpdate,
)
from app.schemas.category import CategoryResponse
from app.schemas.condition import ConditionResponse

router = APIRouter(prefix="/announcements", tags=["announcements"])


@router.get("/", response_model=AnnouncementListResponse)
async def get_announcements(
    request_params: AnnouncementListRequest = Depends(),
    engine: AIOEngine = Depends(deps.engine_generator),
    current_user: User = Depends(deps.get_current_user),
):
    query_conditions = request_params.get_query_conditions(Announcement)
    sort_expression = request_params.get_sort_expression(Announcement)
    skip = (request_params.page - 1) * request_params.limit

    announcements = await crud_announcement.get_many(
        engine,
        *query_conditions,
        skip=skip,
        limit=request_params.limit,
        sort=sort_expression,
    )

    resp_announcements = []
    for ann in announcements:
        announcement_read = AnnouncementRead.from_model(ann)
        resp_announcements.append(announcement_read)

    total_count = await engine.count(crud_announcement.model, *query_conditions)

    return AnnouncementListResponse(items=resp_announcements, totalCount=total_count)


@router.get("/{announcement_id}", response_model=AnnouncementDetailResponse)
async def get_announcement(
    announcement_id: str,
    user_id: str = "123",
    engine: AIOEngine = Depends(deps.engine_generator),
    current_user: User = Depends(deps.get_current_user),
):
    announcement = await crud_announcement.get(
        engine, Announcement.id == announcement_id
    )
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")

    await crud_announcement.update(
        engine,
        db_obj=announcement,
        obj_in=AnnouncementUpdate(view_count=announcement.view_count + 1),
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
                CategoryResponse.from_user_category(user_specific_cat)
            )
        else:
            response_categories.append(CategoryResponse.from_model(original_cat))

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

    response_zotero_annotations: list[ConditionResponse] = []
    DEFAULT_CONDITION_COLOR = "#53A4F3"

    for original_cond in original_conditions:
        user_specific_cond = user_conditions_map.get(original_cond.id)
        annotation = None
        if user_specific_cond:
            annotation = ConditionResponse.from_user_condition(user_specific_cond)
        else:
            annotation = ConditionResponse.from_condition(
                original_cond, DEFAULT_CONDITION_COLOR
            )

        if annotation:
            response_zotero_annotations.append(annotation)

    for uo_cond in user_only_conditions:
        annotation = ConditionResponse.from_user_condition(uo_cond)
        if annotation:
            response_zotero_annotations.append(annotation)

    pdf_url = f"/api/v1/announcements/{announcement_id}/pdf"

    return AnnouncementDetailResponse(
        annotations=response_zotero_annotations,
        categories=response_categories,
        pdfUrl=pdf_url,
        viewCount=announcement.view_count,
    )


@router.get("/{announcement_id}/pdf")
async def get_announcement_pdf(
    announcement_id: str,
    engine: AIOEngine = Depends(deps.engine_generator),
    current_user: User = Depends(deps.get_current_user),
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
