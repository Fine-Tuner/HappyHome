from pydantic import BaseModel

from app.enums import AnnouncementType


class AnnouncementAnalysisCreate(BaseModel):
    announcement_type: AnnouncementType
    announcement_id: str
    model: str
    prompt: str
    content: list | dict
    raw_response: dict


class AnnouncementAnalysisUpdate(BaseModel):
    pass
