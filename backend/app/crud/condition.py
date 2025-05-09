from odmantic import AIOEngine

from app.crud.base import CRUDBase
from app.crud.field_modification import crud_field_modification
from app.enums import ModificationTargetType
from app.models.condition import Condition
from app.schemas.condition import ConditionCreate, ConditionUpdate


class CRUDCondition(CRUDBase[Condition, ConditionCreate, ConditionUpdate]):
    async def delete(self, engine: AIOEngine, condition_id: str) -> Condition | None:
        """
        Override delete to cascade delete related field modifications
        using a transaction for atomicity
        """
        # Get the condition first
        condition = await self.get(engine, Condition.id == condition_id)
        if not condition:
            return None

        # Use a transaction to ensure atomicity
        async with engine.transaction():
            # Delete all related field modifications
            await crud_field_modification.delete_all_for_target(
                engine, condition_id, ModificationTargetType.CONDITION
            )

            # Delete the condition itself
            await engine.delete(condition)

        return condition


crud_condition = CRUDCondition(Condition)
