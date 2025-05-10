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
    announcement_id: str,
    engine: AIOEngine = Depends(deps.engine_generator),
    user_id: str = "123",
):
    if user_condition_in.original_id:
        original_condition = await crud_condition.get(
            engine,
            Condition.id == user_condition_in.original_id,
            Condition.announcement_id == announcement_id,
        )
        if not original_condition:
            raise HTTPException(
                status_code=404,
                detail="Original condition not found for this announcement or ID.",
            )

        existing_user_condition = await crud_user_condition.get(
            engine,
            UserCondition.original_id == user_condition_in.original_id,
            UserCondition.user_id == user_id,
            UserCondition.announcement_id == announcement_id,
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
    "/{original_condition_id}/update",
    response_model=UserConditionRead,
    summary="Update User Condition",
    description="Updates an existing user-specific condition linked to an original condition.",
)
async def update_user_condition(
    original_condition_id: str,
    user_condition_in: UserConditionUpdate,
    announcement_id: str,
    engine: AIOEngine = Depends(deps.engine_generator),
    user_id: str = "123",
):
    original_condition = await crud_condition.get(
        engine,
        Condition.id == original_condition_id,
        Condition.announcement_id == announcement_id,
    )
    if not original_condition:
        raise HTTPException(
            status_code=404,
            detail="Original condition not found for this announcement or ID.",
        )

    existing_user_condition = await crud_user_condition.get(
        engine,
        UserCondition.original_id == original_condition_id,
        UserCondition.user_id == user_id,
        UserCondition.announcement_id == announcement_id,
    )
    if not existing_user_condition:
        raise HTTPException(
            status_code=404,
            detail="User condition not found for this original condition.",
        )

    updated_user_condition = await crud_user_condition.update(
        engine, db_obj=existing_user_condition, obj_in=user_condition_in
    )
    return UserConditionRead.from_model(updated_user_condition)
