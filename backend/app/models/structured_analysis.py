import uuid  # Import uuid
from datetime import datetime, timezone

from pydantic import BaseModel, Field


class StructuredAnalysis(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_field=True)
    announcement_id: str
    layout_id: str
    llm_output_id: str
    structured_analysis: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
