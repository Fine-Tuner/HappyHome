from datetime import datetime, timezone
from uuid import uuid4

from odmantic import Field, Model


class Category(Model):
    id: str = Field(
        default_factory=lambda: str(uuid4()), index=True, primary_field=True
    )
    original_id: str | None = Field(default=None, index=True)
    announcement_id: str = Field(index=True)
    user_id: str | None = Field(default=None, index=True)
    name: str
    comment: str | None = None
    is_deleted: bool = Field(default=False, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
