from pydantic import BaseModel

from app.enums import AnnouncementType


class LLMOutputCreate(BaseModel):
    announcement_type: AnnouncementType
    announcement_id: str
    model: str
    system_prompt: str
    user_prompt: str
    content: list | dict
    raw_response: dict


class LLMOutputUpdate(BaseModel):
    pass
