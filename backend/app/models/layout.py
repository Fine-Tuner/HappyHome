from datetime import datetime, timezone
from uuid import uuid4

from odmantic import Field, Model

from app.schemas.layout import Block


class Layout(Model):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_field=True)
    announcement_id: str
    width: int
    height: int
    blocks: list[Block]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
