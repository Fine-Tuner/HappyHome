from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field

from app.models.page_mapping_result import PageMappingStatus


# Schema for creating a new record
class PageMappingResultCreate(BaseModel):
    announcement_id: str
    page_number: int
    status: PageMappingStatus
    raw_response: dict[str, Any] | None = None
    error_message: str | None = None


# Schema for updating an existing record
class PageMappingResultUpdate(BaseModel):
    status: PageMappingStatus | None = None
    raw_response: dict[str, Any] | None = None
    error_message: str | None = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
