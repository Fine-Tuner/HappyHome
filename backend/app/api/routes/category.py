from fastapi import APIRouter, Depends, HTTPException
from odmantic import AIOEngine

from app.api import deps
from app.crud import crud_category, crud_user_category
from app.models.category import Category
from app.models.user_category import UserCategory
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
    description="Creates a new user-specific category. If category_id is provided, it links to an original category. If category_id is null, it creates a new user-only category.",
)
async def create_user_category(
    user_category_in: UserCategoryCreate,
    engine: AIOEngine = Depends(deps.engine_generator),
    user_id: str = "123",
):
    if user_category_in.original_id:
        original_category = await crud_category.get(
            engine,
            Category.id == user_category_in.original_id,
            Category.announcement_id == user_category_in.announcement_id,
        )
        if not original_category:
            raise HTTPException(
                status_code=404,
                detail="Original category not found for this announcement or ID.",
            )

        existing_user_category = await crud_user_category.get(
            engine,
            UserCategory.original_id == user_category_in.original_id,
            UserCategory.user_id == user_id,
            UserCategory.announcement_id == user_category_in.announcement_id,
        )
        if existing_user_category:
            raise HTTPException(
                status_code=400,
                detail="User category already exists for this original category.",
            )

    new_user_category = await crud_user_category.create(engine, obj_in=user_category_in)
    return UserCategoryRead.from_model(new_user_category)


@router.put(
    "/update",
    response_model=UserCategoryRead,
    summary="Update User Category",
    description="Updates a user-specific category. For original categories, updates the user's version. For user-only categories, updates the category directly.",
)
async def update_user_category(
    user_category_in: UserCategoryUpdate,
    announcement_id: str,
    user_category_id: str,
    engine: AIOEngine = Depends(deps.engine_generator),
    user_id: str = "123",
):
    user_category = await crud_user_category.get(
        engine,
        UserCategory.id == user_category_id,
        UserCategory.user_id == user_id,
        UserCategory.announcement_id == announcement_id,
    )

    if not user_category:
        raise HTTPException(
            status_code=404,
            detail="User-only category not found.",
        )

    updated_category = await crud_user_category.update(
        engine, db_obj=user_category, obj_in=user_category_in
    )
    return UserCategoryRead.from_model(updated_category)


@router.delete(
    "/delete",
    response_model=UserCategoryRead,
    summary="Delete User Category",
    description="Marks a user-specific category as deleted. For original categories, creates a new user category if none exists. For user-only categories, marks the existing one as deleted.",
)
async def delete_user_category(
    user_category_id: str,
    announcement_id: str,
    engine: AIOEngine = Depends(deps.engine_generator),
    user_id: str = "123",
):
    # Handle user-only category case
    user_category = await crud_user_category.get(
        engine,
        UserCategory.id == user_category_id,
        UserCategory.user_id == user_id,
        UserCategory.announcement_id == announcement_id,
    )

    if not user_category:
        raise HTTPException(
            status_code=404,
            detail="User-only category not found.",
        )

    # Mark user-only category as deleted
    updated_category = await crud_user_category.update(
        engine, db_obj=user_category, obj_in=UserCategoryUpdate(is_deleted=True)
    )
    return UserCategoryRead.from_model(updated_category)
