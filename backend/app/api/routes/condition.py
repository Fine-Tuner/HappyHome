from fastapi import APIRouter, Depends, HTTPException, Query
from odmantic import AIOEngine

from app.api import deps
from app.crud import crud_category, crud_condition
from app.models.category import Category
from app.models.condition import Condition
from app.schemas.condition import (
    ConditionCreate,
    ConditionCreateRequest,
    ConditionResponse,
    ConditionUpdate,
    ConditionUpdateRequest,
)

router = APIRouter(prefix="/conditions", tags=["conditions"])


@router.post(
    "/create",
    response_model=ConditionResponse,
    summary="Create Condition",
    description="Creates a new condition for the current user.",
)
async def create_condition(
    request_params: ConditionCreateRequest,
    engine: AIOEngine = Depends(deps.engine_generator),
    user_id: str = "123",  # TODO: get user_id from auth
):
    if request_params.category_id:
        category = await crud_category.get(
            engine,
            Category.id == request_params.category_id,
        )
        if not category:
            raise HTTPException(status_code=404, detail="Category not found.")

    create_condition_in = ConditionCreate(
        **request_params.model_dump(), user_id=user_id
    )
    new_condition = await crud_condition.create(engine, obj_in=create_condition_in)
    return ConditionResponse.from_model(new_condition)


@router.put(
    "/update",
    response_model=ConditionResponse,
    summary="Update Condition",
    description="Updates a condition. If 'id' is provided, updates that specific condition. If 'original_condition_id' is provided, it creates or updates the user's specific version of that original condition.",
)
async def update_condition(
    request_params: ConditionUpdateRequest,
    engine: AIOEngine = Depends(deps.engine_generator),
    user_id: str = "123",
):
    existing_condition = await crud_condition.get(
        engine,
        Condition.id == request_params.id,
    )
    if not existing_condition:
        raise HTTPException(
            status_code=404,
            detail="Condition not found.",
        )

    # user specific condition
    if existing_condition.user_id:
        updated_condition = await crud_condition.update(
            engine,
            db_obj=existing_condition,
            obj_in=ConditionUpdate(**request_params.model_dump()),
        )
        return ConditionResponse.from_model(updated_condition)

    # original condition
    create_condition_in = ConditionCreate(
        original_id=existing_condition.id,
        **existing_condition.model_dump(
            exclude={"user_id", "id", "original_id", "created_at", "updated_at"}
        ),
        user_id=user_id,
    )
    for key, value in request_params.model_dump(
        exclude_none=True, exclude=("id")
    ).items():
        setattr(create_condition_in, key, value)

    new_condition = await crud_condition.create(
        engine,
        obj_in=create_condition_in,
    )
    return ConditionResponse.from_model(new_condition)


@router.delete(
    "/delete",
    response_model=ConditionResponse,
    summary="Delete Condition",
    description="Marks a condition as deleted. If 'id' is provided, marks that specific condition as deleted. If 'original_id' is provided, it marks the user's specific version of that original condition as deleted (or creates a deleted version if none exists).",
)
async def delete_condition(
    id: str = Query(
        description="ID of the condition to delete.",
    ),
    engine: AIOEngine = Depends(deps.engine_generator),
    user_id: str = "123",
):
    existing_condition = await crud_condition.get(
        engine,
        Condition.id == id,
    )
    if not existing_condition:
        raise HTTPException(
            status_code=404,
            detail="Condition not found.",
        )

    # user specific condition
    if existing_condition.user_id:
        if existing_condition.is_deleted:
            return ConditionResponse.from_model(existing_condition)
        updated_condition = await crud_condition.update(
            engine, db_obj=existing_condition, obj_in={"is_deleted": True}
        )
        return ConditionResponse.from_model(updated_condition)

    # original condition
    delete_condition_in = ConditionCreate(
        user_id=user_id,
        announcement_id=existing_condition.announcement_id,
        category_id=existing_condition.category_id,
        original_id=existing_condition.id,
        content=existing_condition.content,
        page=existing_condition.page,
        bbox=existing_condition.bbox,
        section=existing_condition.section,
        is_deleted=True,
    )
    created_condition = await crud_condition.create(engine, obj_in=delete_condition_in)
    return ConditionResponse.from_model(created_condition)
