from fastapi import APIRouter, Depends, HTTPException
from odmantic import AIOEngine

from app.api import deps
from app.crud import crud_category, crud_condition, crud_user_condition
from app.models.category import Category
from app.models.condition import Condition
from app.models.user_condition import UserCondition
from app.schemas.condition import ConditionCreateRequest, ConditionUpdateRequest
from app.schemas.user_condition import (
    UserConditionCreate,
    UserConditionResponse,
    UserConditionUpdate,
)

router = APIRouter(prefix="/conditions", tags=["conditions"])


@router.post(
    "/create",
    response_model=UserConditionResponse,
    summary="Create Condition (User Specific)",
    description="Creates a new user-specific condition. If original_id is provided, it links to an original condition. Otherwise, it's a user-only condition.",
)
async def create_condition(
    request_params: ConditionCreateRequest,
    engine: AIOEngine = Depends(deps.engine_generator),
    user_id: str = "123",  # TODO: get user_id from auth
):
    category = await crud_category.get(
        engine, Category.id == request_params.category_id
    )
    if not category:
        raise HTTPException(status_code=404, detail="Category not found.")

    user_condition_in = UserConditionCreate(
        announcement_id=request_params.announcement_id,
        category_id=request_params.category_id,
        content=request_params.content,
        page=request_params.page,
        bbox=request_params.bbox,
        comment=request_params.comment,
        color=request_params.color,
        user_id=user_id,
    )

    new_user_condition = await crud_user_condition.create(
        engine, obj_in=user_condition_in
    )
    return UserConditionResponse.from_model(new_user_condition)


@router.put(
    "/update",
    response_model=UserConditionResponse,
    summary="Update Condition (User Specific)",
    description="Updates a condition for a user. If user_condition_id is provided, updates that. If only original_id is provided, creates a user-specific version.",
)
async def update_condition(
    request_params: ConditionUpdateRequest,
    engine: AIOEngine = Depends(deps.engine_generator),
    user_id: str = "123",
):
    if request_params.user_condition_id and request_params.original_condition_id:
        raise HTTPException(
            status_code=400,
            detail="Cannot provide both user_condition_id and original_condition_id. Only one should be set.",
        )
    if request_params.user_condition_id:
        user_condition = await crud_user_condition.get(
            engine,
            UserCondition.id == request_params.user_condition_id,
            UserCondition.user_id == user_id,
        )
        if not user_condition:
            raise HTTPException(status_code=404, detail="User condition not found.")

        user_condition_in = UserConditionUpdate(
            content=request_params.content,
            comment=request_params.comment,
            category_id=request_params.category_id,
            bbox=request_params.bbox,
            color=request_params.color,
        )
        updated_condition = await crud_user_condition.update(
            engine, db_obj=user_condition, obj_in=user_condition_in
        )
        return UserConditionResponse.from_model(updated_condition)
    elif request_params.original_condition_id:
        original_condition = await crud_condition.get(
            engine,
            Condition.id == request_params.original_condition_id,
        )
        if not original_condition:
            raise HTTPException(
                status_code=404,
                detail="Original condition not found.",
            )
        user_condition_create_data = UserConditionCreate(
            user_id=user_id,
            announcement_id=original_condition.announcement_id,
            category_id=original_condition.category_id,
            original_id=request_params.original_condition_id,
            content=request_params.content,
            page=original_condition.page,
            bbox=request_params.bbox,
            comment=request_params.comment,
            color=request_params.color,
        )
        new_user_condition = await crud_user_condition.create(
            engine, obj_in=user_condition_create_data
        )
        return UserConditionResponse.from_model(new_user_condition)
    else:
        raise HTTPException(
            status_code=400,
            detail="Must provide either user_condition_id or original_condition_id.",
        )


@router.delete(
    "/delete",
    response_model=UserConditionResponse,
    summary="Delete Condition (User Specific)",
    description="Marks a condition as deleted for a user. If user_condition_id is provided, marks that as deleted. If only original_id is provided, creates a user-specific version and marks as deleted.",
)
async def delete_condition(
    user_condition_id: str | None = None,
    original_condition_id: str | None = None,
    engine: AIOEngine = Depends(deps.engine_generator),
    user_id: str = "123",
):
    if user_condition_id and original_condition_id:
        raise HTTPException(
            status_code=400,
            detail="Cannot provide both user_condition_id and original_condition_id. Only one should be set.",
        )
    if user_condition_id:
        user_condition = await crud_user_condition.get(
            engine,
            UserCondition.id == user_condition_id,
            UserCondition.user_id == user_id,
        )
        if not user_condition:
            raise HTTPException(status_code=404, detail="User condition not found.")
        if user_condition.is_deleted:
            return UserConditionResponse.from_model(user_condition)
        updated_condition = await crud_user_condition.update(
            engine, db_obj=user_condition, obj_in=UserConditionUpdate(is_deleted=True)
        )
        return UserConditionResponse.from_model(updated_condition)
    elif original_condition_id:
        original_condition = await crud_condition.get(
            engine,
            Condition.id == original_condition_id,
        )
        if not original_condition:
            raise HTTPException(
                status_code=404,
                detail="Original condition not found.",
            )
        user_condition_create_data = UserConditionCreate(
            announcement_id=original_condition.announcement_id,
            user_id=user_id,
            original_id=original_condition.id,
            category_id=original_condition.category_id,
            content=original_condition.content,
            section=original_condition.section,
            page=original_condition.page,
            bbox=original_condition.bbox,
            is_deleted=True,
        )
        new_user_condition = await crud_user_condition.create(
            engine, obj_in=user_condition_create_data
        )
        return UserConditionResponse.from_model(new_user_condition)
    else:
        raise HTTPException(
            status_code=400,
            detail="Must provide either user_condition_id or original_condition_id.",
        )
