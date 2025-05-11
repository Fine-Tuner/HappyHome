from datetime import datetime, timezone

from pydantic import BaseModel, Field


class AnnouncementViewCreate(BaseModel):
    announcement_id: str
    view_count: int


class AnnouncementViewUpdate(BaseModel):
    view_count: int
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
