from datetime import datetime

from pydantic import BaseModel

from app.models.category import Category


class CategoryCreate(BaseModel):
    original_id: str | None = None
    announcement_id: str
    user_id: str | None = None
    name: str
    comment: str | None = None
    is_deleted: bool = False


class CategoryUpdate(BaseModel):
    name: str | None = None
    comment: str | None = None
    is_deleted: bool | None = None


class CategoryCreateRequest(BaseModel):
    announcement_id: str
    name: str
    comment: str | None = None
    # user_id will be injected by the endpoint


class CategoryUpdateRequest(BaseModel):
    id: str
    name: str | None = None
    comment: str | None = None


class CategoryResponse(BaseModel):
    id: str
    original_id: str | None = None
    user_id: str | None = None
    name: str
    comment: str | None = None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_model(cls, category: Category) -> "CategoryResponse":
        return cls(
            id=category.id,
            original_id=category.original_id,
            user_id=category.user_id,
            name=category.name,
            comment=category.comment,
            is_deleted=category.is_deleted,
            created_at=category.created_at,
            updated_at=category.updated_at,
        )
