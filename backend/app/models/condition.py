from datetime import datetime, timezone
from uuid import uuid4

from odmantic import Field, Model


class Condition(Model):
    id: str = Field(
        default_factory=lambda: str(uuid4()), index=True, primary_field=True
    )
    original_id: str | None = Field(default=None, index=True)
    llm_output_id: str | None = Field(default=None, index=True)
    announcement_id: str = Field(index=True)
    category_id: str | None = Field(default=None, index=True)
    user_id: str | None = Field(default=None, index=True)
    content: str | None = Field(default=None)
    section: str | None = Field(default=None)
    page: int
    bbox: list[list[float]]
    comment: str | None = Field(default=None)
    color: str | None = Field(default=None)
    is_deleted: bool = Field(default=False, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
