from datetime import datetime, timezone

from pydantic import BaseModel, Field

from app.models.user_category import UserCategory


class UserCategoryCreate(BaseModel):
    user_id: str
    announcement_id: str
    original_id: str | None
    name: str
    comment: str = ""
    is_deleted: bool = False


class UserCategoryUpdate(BaseModel):
    name: str | None = None
    comment: str | None = None
    is_deleted: bool | None = None
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class UserCategoryResponse(BaseModel):
    id: str
    announcement_id: str
    original_id: str | None
    name: str
    comment: str
    is_deleted: bool

    @classmethod
    def from_model(cls, user_category: UserCategory) -> "UserCategoryResponse":
        return cls(
            id=user_category.id,
            announcement_id=user_category.announcement_id,
            original_id=user_category.original_id,
            name=user_category.name,
            comment=user_category.comment,
            is_deleted=user_category.is_deleted,
        )
