from datetime import datetime, timezone
from uuid import uuid4

from odmantic import Field, Model


class Question(Model):
    id: str = Field(
        default_factory=lambda: str(uuid4()), index=True, primary_field=True
    )
    title: str = Field(..., min_length=1, max_length=150)
    content: str = Field(..., min_length=1)
    user_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    upvotes: int = 0
    views: int = 0  # expandable panel?
    is_deleted: bool = Field(default=False, index=True)
