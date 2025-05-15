from fastapi import APIRouter, Depends, HTTPException
from odmantic import AIOEngine

from app.api import deps
from app.crud import crud_condition, crud_user_condition
from app.models.condition import Condition
from app.models.user_condition import UserCondition
from app.schemas.user_condition import (
    UserConditionCreate,
    UserConditionRead,
    UserConditionUpdate,
)

router = APIRouter(prefix="/conditions", tags=["conditions"])


@router.post(
    "/create",
    response_model=UserConditionRead,
    summary="Create User Condition",
    description="Creates a new user-specific condition. If original_condition_id is provided, it links to an original condition. If original_condition_id is null, it creates a new user-only condition.",
)
async def create_user_condition(
    user_condition_in: UserConditionCreate,
    engine: AIOEngine = Depends(deps.engine_generator),
):
    if user_condition_in.original_id:
        original_condition = await crud_condition.get(
            engine,
            Condition.id == user_condition_in.original_id,
            Condition.announcement_id == user_condition_in.announcement_id,
        )
        if not original_condition:
            raise HTTPException(
                status_code=404,
                detail="Original condition not found for this announcement or ID.",
            )

        existing_user_condition = await crud_user_condition.get(
            engine,
            UserCondition.original_id == user_condition_in.original_id,
            UserCondition.user_id == user_condition_in.user_id,
            UserCondition.announcement_id == user_condition_in.announcement_id,
        )
        if existing_user_condition:
            raise HTTPException(
                status_code=400,
                detail="User condition already exists for this original condition.",
            )

    new_user_condition = await crud_user_condition.create(
        engine, obj_in=user_condition_in
    )
    return UserConditionRead.from_model(new_user_condition)


@router.put(
    "/update",
    response_model=UserConditionRead,
    summary="Update User Condition",
    description="Updates a user-specific condition. For original conditions, updates the user's version. For user-only conditions, updates the condition directly.",
)
async def update_user_condition(
    user_condition_in: UserConditionUpdate,
    announcement_id: str,
    user_condition_id: str,
    engine: AIOEngine = Depends(deps.engine_generator),
    user_id: str = "123",
):
    user_condition = await crud_user_condition.get(
        engine,
        UserCondition.id == user_condition_id,
        UserCondition.user_id == user_id,
        UserCondition.announcement_id == announcement_id,
    )

    if not user_condition:
        raise HTTPException(
            status_code=404,
            detail="User-only condition not found.",
        )

    updated_condition = await crud_user_condition.update(
        engine, db_obj=user_condition, obj_in=user_condition_in
    )
    return UserConditionRead.from_model(updated_condition)


@router.delete(
    "/delete",
    response_model=UserConditionRead,
    summary="Delete User Condition",
    description="Marks a user-specific condition as deleted. For original conditions, creates a new user condition if none exists. For user-only conditions, marks the existing one as deleted.",
)
async def delete_user_condition(
    user_condition_id: str,
    announcement_id: str,
    engine: AIOEngine = Depends(deps.engine_generator),
    user_id: str = "123",
):
    # Handle user-only condition case
    user_condition = await crud_user_condition.get(
        engine,
        UserCondition.id == user_condition_id,
        UserCondition.user_id == user_id,
        UserCondition.announcement_id == announcement_id,
    )

    if not user_condition:
        raise HTTPException(
            status_code=404,
            detail="User-only condition not found.",
        )

    # Mark user-only condition as deleted
    updated_condition = await crud_user_condition.update(
        engine, db_obj=user_condition, obj_in=UserConditionUpdate(is_deleted=True)
    )
    return UserConditionRead.from_model(updated_condition)
