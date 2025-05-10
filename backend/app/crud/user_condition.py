from app.crud.base import CRUDBase
from app.models.user_condition import UserCondition
from app.schemas.user_condition import UserConditionCreate, UserConditionUpdate


class CRUDUserCondition(
    CRUDBase[UserCondition, UserConditionCreate, UserConditionUpdate]
):
    pass


crud_user_condition = CRUDUserCondition(UserCondition)
