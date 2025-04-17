from uuid import uuid4
from odmantic import Model, Field
from datetime import datetime, timezone


class AnnouncementAnalysis(Model):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_field=True)
    announcement_id: str
    llm_model: str
    prompt: str
    response: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
