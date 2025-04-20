from app.crud.base import CRUDBase
from app.models.announcement_analysis import AnnouncementAnalysis
from app.schemas.announcement_analysis import (
    AnnouncementAnalysisCreate,
    AnnouncementAnalysisUpdate,
)


class CRUDAnnouncementAnalysis(
    CRUDBase[
        AnnouncementAnalysis, AnnouncementAnalysisCreate, AnnouncementAnalysisUpdate
    ]
):
    pass


announcement_analysis = CRUDAnnouncementAnalysis(AnnouncementAnalysis)
