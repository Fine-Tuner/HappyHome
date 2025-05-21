from datetime import datetime, timezone
from uuid import uuid4

from odmantic import Field, Model


class Comment(Model):
    id: str = Field(
        default_factory=lambda: str(uuid4()), index=True, primary_field=True
    )
    question_id: str
    user_id: str
    content: str = Field(..., min_length=1, max_length=1000)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    upvotes: int = 0
    is_deleted: bool = Field(default=False, index=True)
