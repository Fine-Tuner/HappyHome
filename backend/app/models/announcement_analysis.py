from datetime import datetime, timezone
from uuid import uuid4

from odmantic import Field, Model


class AnnouncementAnalysis(Model):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_field=True)
    announcement_id: str
    model: str
    prompt: str
    content: list | dict
    raw_response: dict
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
