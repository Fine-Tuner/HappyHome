from pydantic import BaseModel

from app.models.category import Category
from app.models.user_category import UserCategory
from app.utils.decorators import not_implemented


class CategoryCreate(BaseModel):
    announcement_id: str
    name: str


@not_implemented
class CategoryUpdate(BaseModel):
    pass


class CategoryCreateRequest(BaseModel):
    announcement_id: str
    name: str
    comment: str = ""
    original_category_id: str | None = None
    # user_id will be injected by the endpoint/dependency


class CategoryUpdateRequest(BaseModel):
    user_category_id: str | None = None
    original_category_id: str | None = None
    name: str | None = None
    comment: str | None = None


class CategoryDeleteRequest(BaseModel):
    user_category_id: str | None = None
    original_category_id: str | None = None


class CategoryResponse(BaseModel):
    id: str | None = None  # user_category.id
    original_id: str | None = None  # category.id
    name: str
    comment: str
    dateCreated: str
    dateModified: str

    @classmethod
    def from_model(cls, category: Category) -> "CategoryResponse":
        return cls(
            original_id=category.id,
            name=category.name,
            comment="",
            dateCreated=category.created_at.isoformat(),
            dateModified=category.updated_at.isoformat(),
        )

    @classmethod
    def from_user_category(cls, user_category: UserCategory) -> "CategoryResponse":
        return cls(
            id=user_category.id,
            name=user_category.name,
            comment=user_category.comment,
            dateCreated=user_category.created_at.isoformat(),
            dateModified=user_category.updated_at.isoformat(),
        )
