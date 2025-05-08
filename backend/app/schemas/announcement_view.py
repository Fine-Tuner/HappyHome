from datetime import datetime

from pydantic import BaseModel


class AnnouncementViewCreate(BaseModel):
    announcement_id: str
    view_count: int


class AnnouncementViewUpdate(BaseModel):
    view_count: int
    updated_at: datetime
