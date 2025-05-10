from app.crud.base import CRUDBase
from app.models.user_category import UserCategory
from app.schemas.user_category import UserCategoryCreate, UserCategoryUpdate


class CRUDUserCategory(CRUDBase[UserCategory, UserCategoryCreate, UserCategoryUpdate]):
    pass


crud_user_category = CRUDUserCategory(UserCategory)
