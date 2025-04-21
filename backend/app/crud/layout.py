from app.crud.base import CRUDBase
from app.models.layout import Layout
from app.schemas.layout import LayoutCreate, LayoutUpdate


class CRUDAnnouncementLayout(CRUDBase[Layout, LayoutCreate, LayoutUpdate]):
    pass


crud_layout = CRUDAnnouncementLayout(Layout)
