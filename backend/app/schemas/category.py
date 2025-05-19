from pydantic import BaseModel

from app.models.category import Category
from app.utils.decorators import not_implemented


class CategoryCreate(BaseModel):
    announcement_id: str
    name: str


@not_implemented
class CategoryUpdate(BaseModel):
    pass


class CategoryRead(BaseModel):
    id: str
    name: str
    comment: str = ""

    @classmethod
    def from_model(cls, category: Category) -> "CategoryRead":
        return cls(id=category.id, name=category.name, comment="")


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
