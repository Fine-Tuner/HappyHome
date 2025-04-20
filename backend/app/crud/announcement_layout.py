from app.crud.base import CRUDBase
from app.models.announcement_layout import AnnouncementLayout
from app.schemas.announcement_layout import (
    AnnouncementLayoutCreate,
    AnnouncementLayoutUpdate,
)


class CRUDAnnouncementLayout(
    CRUDBase[AnnouncementLayout, AnnouncementLayoutCreate, AnnouncementLayoutUpdate]
):
    pass


announcement_layout = CRUDAnnouncementLayout(AnnouncementLayout)
