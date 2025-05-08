from app.crud.base import CRUDBase
from app.models.announcement_view import AnnouncementView
from app.schemas.announcement_view import AnnouncementViewCreate, AnnouncementViewUpdate


class CRUDAnnouncementView(
    CRUDBase[AnnouncementView, AnnouncementViewCreate, AnnouncementViewUpdate]
):
    pass


crud_announcement_view = CRUDAnnouncementView(AnnouncementView)
