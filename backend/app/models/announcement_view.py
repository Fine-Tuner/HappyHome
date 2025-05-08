from datetime import datetime, timezone
from uuid import uuid4

from odmantic import Field, Model


class AnnouncementView(Model):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_field=True)
    announcement_id: str = Field(index=True)
    view_count: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
