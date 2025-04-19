from pydantic import BaseModel


class AnnouncementAnalysisCreate(BaseModel):
    announcement_id: str
    model: str
    prompt: str
    content: list | dict
    raw_response: dict


class AnnouncementAnalysisUpdate(BaseModel):
    pass
