from app.crud.base import CRUDBase
from app.models.condition import Condition
from app.schemas.condition import ConditionCreate, ConditionUpdate


class CRUDCondition(CRUDBase[Condition, ConditionCreate, ConditionUpdate]):
    pass


crud_condition = CRUDCondition(Condition)
