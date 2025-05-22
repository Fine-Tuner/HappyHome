from fastapi import APIRouter, Depends
from odmantic import AIOEngine

from app.api import deps
from app.crud import crud_user
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate, UserUpdateRequest

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(deps.get_current_user),
) -> UserResponse:
    return UserResponse.from_model(current_user)


@router.put("/me", response_model=UserResponse)
async def update_me(
    request_params: UserUpdateRequest,
    engine: AIOEngine = Depends(deps.engine_generator),
    current_user: User = Depends(deps.get_current_user),
) -> UserResponse:
    user_update_in = UserUpdate(
        income=request_params.income,
        bookmark_announcement_ids=request_params.bookmark_announcement_ids,
    )
    user = await crud_user.update(engine, current_user, user_update_in)
    return UserResponse.from_model(user)
