from typing import Any

from odmantic import AIOEngine

from app.crud.base import CRUDBase
from app.models.condition import Condition
from app.schemas.condition import ConditionCreate, ConditionUpdate


class CRUDCondition(CRUDBase[Condition, ConditionCreate, ConditionUpdate]):
    async def delete(self, engine: AIOEngine, *args: Any) -> int:
        raise NotImplementedError("Delete operation is not implemented for conditions.")

    async def delete_many(self, engine: AIOEngine, *args: Any) -> int:
        raise NotImplementedError(
            "Delete_many operation is not implemented for conditions."
        )


crud_condition = CRUDCondition(Condition)
