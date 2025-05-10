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
    announcement_id: str,
    engine: AIOEngine = Depends(deps.engine_generator),
    user_id: str = "123",
):
    if user_category_in.original_id:
        original_category = await crud_category.get(
            engine,
            Category.id == user_category_in.original_id,
            Category.announcement_id == announcement_id,
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
            UserCategory.announcement_id == announcement_id,
        )
        if existing_user_category:
            raise HTTPException(
                status_code=400,
                detail="User category already exists for this original category.",
            )

    new_user_category = await crud_user_category.create(engine, obj_in=user_category_in)
    return UserCategoryRead.from_model(new_user_category)


@router.put(
    "/{category_id}/update",
    response_model=UserCategoryRead,
    summary="Update User Category",
    description="Updates an existing user-specific category linked to an original category.",
)
async def update_user_category(
    category_id: str,
    user_category_in: UserCategoryUpdate,
    announcement_id: str,
    engine: AIOEngine = Depends(deps.engine_generator),
    user_id: str = "123",
):
    original_category = await crud_category.get(
        engine,
        Category.id == category_id,
        Category.announcement_id == announcement_id,
    )
    if not original_category:
        raise HTTPException(
            status_code=404,
            detail="Original category not found for this announcement or ID.",
        )

    existing_user_category = await crud_user_category.get(
        engine,
        UserCategory.original_id == category_id,
        UserCategory.user_id == user_id,
        UserCategory.announcement_id == announcement_id,
    )
    if not existing_user_category:
        raise HTTPException(
            status_code=404,
            detail="User category not found for this original category.",
        )

    updated_user_category = await crud_user_category.update(
        engine, db_obj=existing_user_category, obj_in=user_category_in
    )
    return UserCategoryRead.from_model(updated_user_category)
