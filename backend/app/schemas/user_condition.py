from datetime import datetime, timezone

from pydantic import BaseModel, Field

from app.models.user_condition import UserCondition


class UserConditionCreate(BaseModel):
    announcement_id: str
    category_id: str
    original_id: str | None = None
    content: str = ""
    page: int
    bbox: list[list[float]]
    comment: str = ""
    color: str = "#000000"
    user_id: str
    is_deleted: bool = False


class UserConditionUpdate(BaseModel):
    content: str | None = None
    comment: str | None = None
    category_id: str | None = None
    bbox: list[list[float]] | None = None
    color: str | None = None
    is_deleted: bool | None = None
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class UserConditionResponse(BaseModel):
    id: str
    announcement_id: str
    original_id: str | None
    category_id: str | None
    content: str
    comment: str
    section: str | None
    page: int
    bbox: list[list[float]]
    color: str
    user_id: str
    is_deleted: bool

    @classmethod
    def from_model(cls, user_condition: UserCondition) -> "UserConditionResponse":
        return cls(
            id=user_condition.id,
            announcement_id=user_condition.announcement_id,
            original_id=user_condition.original_id,
            category_id=user_condition.category_id,
            content=user_condition.content,
            comment=user_condition.comment,
            section=user_condition.section,
            page=user_condition.page,
            bbox=user_condition.bbox,
            color=user_condition.color,
            user_id=user_condition.user_id,
            is_deleted=user_condition.is_deleted,
        )
