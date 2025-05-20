from typing import Any

from odmantic import AIOEngine

from app.crud.base import CRUDBase
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


class CRUDCategory(CRUDBase[Category, CategoryCreate, CategoryUpdate]):
    async def get_many_by_ids(
        self, engine: AIOEngine, *, ids: list[str]
    ) -> list[Category]:
        """
        Retrieves multiple Category objects from the database by their IDs using ODMantic query.

        Args:
            engine: The AIOEngine instance for database interaction.
            ids: A list of category IDs to retrieve.

        Returns:
            A list of Category model instances.
        """
        if not ids:
            return []
        return await engine.find(self.model, self.model.id.in_(ids))

    async def delete(self, engine: AIOEngine, *args: Any) -> int:
        raise NotImplementedError("Delete operation is not implemented for categories.")

    async def delete_many(self, engine: AIOEngine, *args: Any) -> int:
        raise NotImplementedError(
            "Delete_many operation is not implemented for categories."
        )


crud_category = CRUDCategory(Category)
