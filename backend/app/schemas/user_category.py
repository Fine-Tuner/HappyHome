from pydantic import BaseModel

from app.models.user_category import UserCategory


class UserCategoryBase(BaseModel):
    name: str
    comment: str = ""


class UserCategoryCreate(UserCategoryBase):
    announcement_id: str
    user_id: str
    original_id: str | None = None


class UserCategoryUpdate(UserCategoryBase):
    # For PUT, all fields are typically required to replace the resource's state.
    # If PATCH is desired later, fields can be made optional.
    name: str
    comment: str = ""


class UserCategoryRead(UserCategoryBase):
    id: str
    announcement_id: str
    user_id: str
    original_id: str | None

    @classmethod
    def from_model(cls, user_category: UserCategory) -> "UserCategoryRead":
        return cls(
            id=user_category.id,
            announcement_id=user_category.announcement_id,
            user_id=user_category.user_id,
            original_id=user_category.original_id,
            name=user_category.name,
            comment=user_category.comment,
        )
