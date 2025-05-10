from datetime import datetime, timezone
from uuid import uuid4

from odmantic import Field, Model


class UserCondition(Model):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_field=True)
    user_id: str = Field(index=True)
    original_id: str | None = Field(default=None, index=True)
    announcement_id: str = Field(index=True)
    category_id: str | None = Field(default=None, index=True)
    content: str
    section: str
    page: int
    bbox: list[float]
    comment: str = ""
    color: str = "#000000"
    is_deleted: bool = Field(default=False, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
