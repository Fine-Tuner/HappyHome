from fastapi import APIRouter, Depends, HTTPException
from odmantic import AIOEngine

from app.api import deps
from app.crud import crud_category, crud_user_category
from app.models.category import Category
from app.models.user_category import UserCategory
from app.schemas.category import CategoryCreateRequest, CategoryUpdateRequest
from app.schemas.user_category import (
    UserCategoryCreate,
    UserCategoryRead,
    UserCategoryUpdate,
)

router = APIRouter(prefix="/categories", tags=["categories"])


@router.post(
    "/create",
    response_model=UserCategoryRead,
    summary="Create User Category",
    description="Creates a new user-specific category. If original_category_id is provided, it links to an original category. Otherwise, it's a user-only category.",
)
async def create_category(
    request_params: CategoryCreateRequest,
    engine: AIOEngine = Depends(deps.engine_generator),
    user_id: str = "123",  # TODO: get user_id from auth
):
    user_category_in = UserCategoryCreate(
        announcement_id=request_params.announcement_id,
        name=request_params.name,
        comment=request_params.comment,
        original_id=request_params.original_category_id,
        user_id=user_id,
    )
    new_user_category = await crud_user_category.create(engine, obj_in=user_category_in)
    return UserCategoryRead.from_model(new_user_category)


@router.put(
    "/update",
    response_model=UserCategoryRead,
    summary="Update User Category",
    description="Updates a user-specific category. If user_category_id is provided, updates that. If only original_category_id is provided, creates a user-specific version.",
)
async def update_category(
    request_params: CategoryUpdateRequest,
    engine: AIOEngine = Depends(deps.engine_generator),
    user_id: str = "123",
):
    if request_params.user_category_id:
        user_category = await crud_user_category.get(
            engine,
            UserCategory.id == request_params.user_category_id,
            UserCategory.user_id == user_id,
        )
        if not user_category:
            raise HTTPException(status_code=404, detail="User category not found.")

        user_category_in = UserCategoryUpdate(
            name=request_params.name,
            comment=request_params.comment,
        )
        updated_category = await crud_user_category.update(
            engine, db_obj=user_category, obj_in=user_category_in
        )
        return UserCategoryRead.from_model(updated_category)
    elif request_params.original_category_id:
        original_category = await crud_category.get(
            engine,
            Category.id == request_params.original_category_id,
        )
        if not original_category:
            raise HTTPException(status_code=404, detail="Original category not found.")
        user_category_in = UserCategoryCreate(
            user_id=user_id,
            announcement_id=original_category.announcement_id,
            original_id=original_category.id,
            name=request_params.name,
            comment=request_params.comment,
        )
        new_user_category = await crud_user_category.create(
            engine, obj_in=user_category_in
        )
        return UserCategoryRead.from_model(new_user_category)
    else:
        raise HTTPException(
            status_code=400,
            detail="Must provide either user_category_id or original_category_id.",
        )


@router.delete(
    "/delete",
    response_model=UserCategoryRead,
    summary="Delete User Category",
    description="Marks a user-specific category as deleted. If user_category_id is provided, marks that as deleted. If only original_category_id is provided, creates a user-specific version and marks as deleted.",
)
async def delete_category(
    user_category_id: str | None = None,
    original_category_id: str | None = None,
    engine: AIOEngine = Depends(deps.engine_generator),
    user_id: str = "123",
):
    if user_category_id:
        user_category = await crud_user_category.get(
            engine,
            UserCategory.id == user_category_id,
            UserCategory.user_id == user_id,
        )
        if not user_category:
            raise HTTPException(status_code=404, detail="User category not found.")
        updated_category = await crud_user_category.update(
            engine, db_obj=user_category, obj_in=UserCategoryUpdate(is_deleted=True)
        )
        return UserCategoryRead.from_model(updated_category)
    elif original_category_id:
        original_category = await crud_category.get(
            engine,
            Category.id == original_category_id,
        )
        if not original_category:
            raise HTTPException(status_code=404, detail="Original category not found.")
        user_category_in = UserCategoryCreate(
            user_id=user_id,
            announcement_id=original_category.announcement_id,
            original_id=original_category.id,
            name=original_category.name,
            is_deleted=True,
        )
        new_user_category = await crud_user_category.create(
            engine, obj_in=user_category_in
        )
        return UserCategoryRead.from_model(new_user_category)
    else:
        raise HTTPException(
            status_code=400,
            detail="Must provide either user_category_id or original_category_id.",
        )
