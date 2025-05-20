from fastapi import APIRouter, Depends, HTTPException, Query
from odmantic import AIOEngine

from app.api import deps
from app.crud import crud_category
from app.models.category import Category
from app.models.user import User
from app.schemas.category import (
    CategoryCreate,
    CategoryCreateRequest,
    CategoryResponse,
    CategoryUpdate,
    CategoryUpdateRequest,
)

router = APIRouter(prefix="/categories", tags=["categories"])


@router.post(
    "/create",
    response_model=CategoryResponse,
    summary="Create Category",
    description="Creates a new category for the current user.",
)
async def create_category(
    request_params: CategoryCreateRequest,
    engine: AIOEngine = Depends(deps.engine_generator),
    current_user: User = Depends(deps.get_current_user),
):
    user_id = current_user.id
    create_category_in = CategoryCreate(**request_params.model_dump(), user_id=user_id)
    new_category = await crud_category.create(engine, obj_in=create_category_in)
    return CategoryResponse.from_model(new_category)


@router.put(
    "/update",
    response_model=CategoryResponse,
    summary="Update Category",
    description="Updates a category. If 'id' is provided, updates that specific category. If 'original_category_id' is provided, it creates or updates the user's specific version of that original category.",
)
async def update_category(
    request_params: CategoryUpdateRequest,
    engine: AIOEngine = Depends(deps.engine_generator),
    current_user: User = Depends(deps.get_current_user),
):
    user_id = current_user.id
    existing_category = await crud_category.get(
        engine,
        Category.id == request_params.id,
    )
    if not existing_category:
        raise HTTPException(status_code=404, detail="Category not found.")

    # user specific category
    if existing_category.user_id:
        updated_category = await crud_category.update(
            engine,
            db_obj=existing_category,
            obj_in=CategoryUpdate(**request_params.model_dump()),
        )
        return CategoryResponse.from_model(updated_category)

    # original category
    create_category_in = CategoryCreate(
        original_id=existing_category.id,
        **existing_category.model_dump(  # TODO: refactor this
            exclude={"user_id", "id", "original_id", "created_at", "updated_at"}
        ),
        user_id=user_id,
    )
    for key, value in request_params.model_dump(
        exclude_none=True, exclude=("id")
    ).items():
        setattr(create_category_in, key, value)

    new_category = await crud_category.create(
        engine,
        obj_in=create_category_in,
    )
    return CategoryResponse.from_model(new_category)


@router.delete(
    "/delete",
    response_model=CategoryResponse,
    summary="Delete Category",
    description="Marks a category as deleted. If 'id' is provided, marks that specific category as deleted. If 'original_id' is provided, it marks the user's specific version of that original category as deleted (or creates a deleted version if none exists).",
)
async def delete_category(
    id: str = Query(
        description="ID of the user's category to delete.",
    ),
    engine: AIOEngine = Depends(deps.engine_generator),
    current_user: User = Depends(deps.get_current_user),
):
    user_id = current_user.id
    existing_category = await crud_category.get(
        engine,
        Category.id == id,
    )
    if not existing_category:
        raise HTTPException(status_code=404, detail="Category not found.")

    # user specific category
    if existing_category.user_id:
        updated_category = await crud_category.update(
            engine, db_obj=existing_category, obj_in={"is_deleted": True}
        )
        return CategoryResponse.from_model(updated_category)

    # original category
    delete_category_in = CategoryCreate(
        user_id=user_id,
        announcement_id=existing_category.announcement_id,
        original_id=existing_category.id,
        name=existing_category.name,
        comment=existing_category.comment,
        is_deleted=True,
    )
    created_category = await crud_category.create(engine, obj_in=delete_category_in)
    return CategoryResponse.from_model(created_category)
