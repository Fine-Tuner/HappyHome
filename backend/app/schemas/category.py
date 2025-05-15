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
