from pydantic import BaseModel
from datetime import datetime


class BaseAnnouncementAnalysis(BaseModel):
    id: str
    announcement_id: str
    llm_model: str
    prompt: str
    response: str
    created_at: datetime
    updated_at: datetime


class AnnouncementAnalysisCreate(BaseAnnouncementAnalysis):
    pass


class AnnouncementAnalysisUpdate(BaseAnnouncementAnalysis):
    pass
