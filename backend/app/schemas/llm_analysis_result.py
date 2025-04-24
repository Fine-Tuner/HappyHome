from datetime import datetime, timezone

from pydantic import BaseModel, Field

from app.enums import AnnouncementType


class LLMAnalysisResultCreate(BaseModel):
    announcement_type: AnnouncementType
    announcement_id: str
    model: str
    raw_response: dict
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class LLMAnalysisResultUpdate(BaseModel):
    pass
