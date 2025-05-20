from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from odmantic import AIOEngine

from app.api import deps
from app.core.config import settings
from app.crud import crud_announcement, crud_category, crud_condition
from app.models.announcement import Announcement
from app.models.category import Category
from app.models.condition import Condition
from app.models.user import User
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
    engine: AIOEngine = Depends(deps.engine_generator),
    current_user: User = Depends(deps.get_current_user),
):
    # Get the ID of the currently authenticated user to filter user-specific data
    user_id = current_user.id

    # Retrieve the basic announcement details from the database
    announcement = await crud_announcement.get(
        engine, Announcement.id == announcement_id
    )
    # If the announcement doesn't exist, raise a 404 error
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")

    # Increment the view count for this announcement
    await crud_announcement.update(
        engine,
        db_obj=announcement,
        obj_in=AnnouncementUpdate(view_count=announcement.view_count + 1),
    )

    # --- Category Processing --- #
    # Step 1: Fetch all category documents associated with this announcement_id.
    # This includes original categories (user_id is None) and any user-specific versions.
    all_categories_for_ann = await crud_category.get_many(
        engine, Category.announcement_id == announcement_id
    )

    # Step 2: Separate the fetched categories into two lists:
    # - original_categories_list: Categories that are not tied to any user (user_id is None).
    # - user_specific_categories_list: Categories created or modified by the current user.
    original_categories_list = [
        cat for cat in all_categories_for_ann if cat.user_id is None
    ]
    user_specific_categories_list = [
        cat for cat in all_categories_for_ann if cat.user_id == user_id
    ]

    # Step 3: Create a map for quick lookup of user-specific versions of original categories.
    # Key: original_category_id, Value: user_specific_category_document (which is a copy with user modifications).
    user_modified_originals_map = {
        cat.original_id: cat
        for cat in user_specific_categories_list
        if cat.original_id
        is not None  # Only include if it's a user's version of an original
    }

    response_categories = []  # This list will hold the final categories for the API response.
    # Step 4: Iterate through the original categories to decide which version to include in the response.
    for original_cat in original_categories_list:
        user_version = user_modified_originals_map.get(original_cat.id)

        if user_version:
            # If a user-specific version exists, only add it if it's NOT marked as deleted.
            # If it IS deleted, then neither the user version nor the original is shown for this user.
            if not user_version.is_deleted:
                response_categories.append(CategoryResponse.from_model(user_version))
        else:
            # No user-specific version exists for this original, so add the original.
            response_categories.append(CategoryResponse.from_model(original_cat))

    # Step 5: Add categories that were created solely by the user (i.e., not linked to any original_id)
    # to the response list, provided they are not marked as deleted.
    user_only_creations = [
        cat
        for cat in user_specific_categories_list
        if cat.original_id is None
        and not cat.is_deleted  # Must not be linked and not deleted
    ]
    for cat in user_only_creations:
        response_categories.append(CategoryResponse.from_model(cat))

    # --- Condition Processing (Annotations) --- #
    # Logic is similar to category processing.
    # Step 1: Fetch all condition documents for this announcement.
    all_conditions_for_ann = await crud_condition.get_many(
        engine, Condition.announcement_id == announcement_id
    )

    # Step 2: Separate into original and user-specific conditions.
    original_conditions_list = [
        cond for cond in all_conditions_for_ann if cond.user_id is None
    ]
    user_specific_conditions_list = [
        cond for cond in all_conditions_for_ann if cond.user_id == user_id
    ]

    # Step 3: Map user-specific versions of original conditions.
    user_modified_original_conditions_map = {
        cond.original_id: cond
        for cond in user_specific_conditions_list
        if cond.original_id is not None
    }

    response_conditions: list[ConditionResponse] = []
    DEFAULT_CONDITION_COLOR = (
        "#53A4F3"  # Default color for original conditions without a specific color.
    )

    # Step 4: Iterate through original conditions.
    for original_cond in original_conditions_list:
        user_version = user_modified_original_conditions_map.get(original_cond.id)
        annotation_to_add = None

        if user_version:
            # If a user-specific version exists, only use it if it's NOT marked as deleted.
            # If it IS deleted, then neither the user version nor the original is shown for this user.
            if not user_version.is_deleted:
                annotation_to_add = ConditionResponse.from_model(user_version)
            # else: user_version is deleted, so annotation_to_add remains None, skipping both
        else:
            # No user-specific version exists, so use the original condition.
            annotation_to_add = ConditionResponse.from_model(original_cond)
            if annotation_to_add.color is None:
                annotation_to_add.color = DEFAULT_CONDITION_COLOR

        if annotation_to_add:
            response_conditions.append(annotation_to_add)

    # Step 5: Add user-only created conditions if not deleted.
    user_only_condition_creations = [
        cond
        for cond in user_specific_conditions_list
        if cond.original_id is None and not cond.is_deleted
    ]
    for user_only_cond in user_only_condition_creations:
        # ConditionResponse.from_model will use the color from the user_only_cond.
        # The /conditions/create endpoint ensures a default color if not provided by the user upon creation.
        response_conditions.append(ConditionResponse.from_model(user_only_cond))

    # Prepare the PDF URL for the announcement.
    pdf_url = f"/api/v1/announcements/{announcement_id}/pdf"

    # Construct and return the final detailed response.
    return AnnouncementDetailResponse(
        annotations=response_conditions,
        categories=response_categories,
        pdfUrl=pdf_url,
        viewCount=announcement.view_count,
    )


@router.get("/{announcement_id}/pdf")
async def get_announcement_pdf(
    announcement_id: str,
    engine: AIOEngine = Depends(deps.engine_generator),
    current_user: User = Depends(
        deps.get_current_user
    ),  # Added for consistency, auth may be checked by dependency
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
