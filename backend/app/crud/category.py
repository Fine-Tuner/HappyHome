from typing import Any

from odmantic import AIOEngine

from app.crud.base import CRUDBase
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


class CRUDCategory(CRUDBase[Category, CategoryCreate, CategoryUpdate]):
    async def update(
        self, engine: AIOEngine, *, db_obj: Category, obj_in: CategoryUpdate
    ) -> Category:
        raise NotImplementedError("Update operation is not implemented for categories.")

    async def delete(self, engine: AIOEngine, *args: Any) -> int:
        raise NotImplementedError("Delete operation is not implemented for categories.")

    async def delete_many(self, engine: AIOEngine, *args: Any) -> int:
        raise NotImplementedError(
            "Delete_many operation is not implemented for categories."
        )


crud_category = CRUDCategory(Category)
