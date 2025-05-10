from pydantic import BaseModel

from app.models.user_condition import UserCondition


class UserConditionBase(BaseModel):
    content: str
    comment: str = ""
    category_id: str | None = None
    section: str | None = None
    page: int
    bbox: list[float]


class UserConditionCreate(UserConditionBase):
    announcement_id: str
    user_id: str
    original_id: str | None = None


class UserConditionUpdate(BaseModel):
    content: str
    comment: str = ""


class UserConditionRead(UserConditionBase):
    id: str
    user_id: str
    original_id: str | None
    announcement_id: str

    @classmethod
    def from_model(cls, user_condition: UserCondition) -> "UserConditionRead":
        return cls(
            id=user_condition.id,
            user_id=user_condition.user_id,
            original_id=user_condition.original_id,
            announcement_id=user_condition.announcement_id,
            content=user_condition.content,
            comment=user_condition.comment,
            category_id=user_condition.category_id,
            section=user_condition.section,
            page=user_condition.page,
            bbox=user_condition.bbox,
        )
