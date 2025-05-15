from datetime import datetime, timezone
from uuid import uuid4

from odmantic import Field, Model


class Condition(Model):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_field=True)
    announcement_id: str = Field(index=True)
    llm_output_id: str = Field(index=True)
    category_id: str = Field(index=True)
    content: str
    section: str
    page: int
    bbox: list[float]  # normalized bbox
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
