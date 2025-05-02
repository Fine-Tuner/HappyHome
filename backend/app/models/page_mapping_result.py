from datetime import datetime, timezone
from enum import Enum
from typing import Any
from uuid import uuid4

from odmantic import Field, Index, Model


class PageMappingStatus(str, Enum):
    SUCCESS = "success"
    ERROR = "error"


class PageMappingResult(Model):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_field=True)
    announcement_id: str = Field(index=True)
    page_number: int = Field(index=True)
    status: PageMappingStatus
    raw_response: dict[str, Any] | None = None
    error_message: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # https://art049.github.io/odmantic/modeling/
    model_config = {
        "indexes": lambda: [
            Index(
                PageMappingResult.announcement_id,
                PageMappingResult.page_number,
                unique=True,
            )
        ]
    }
