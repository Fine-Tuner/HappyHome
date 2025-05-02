from datetime import datetime, timezone
from uuid import uuid4

from odmantic import Field, Index, Model


class LLMAnalysisResult(Model):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_field=True)
    announcement_id: str = Field(index=True)
    model: str
    raw_response: dict
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # https://art049.github.io/odmantic/modeling/
    model_config = {
        "indexes": lambda: [
            Index(
                LLMAnalysisResult.announcement_id, LLMAnalysisResult.model, unique=True
            )
        ]
    }
