from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from odmantic import Field, Index, Model
from pydantic import EmailStr

from app.enums import ModificationTargetType


class FieldModification(Model):
    """
    Tracks only the latest modification for each field of a target object.
    Unlike the Modification model, this doesn't track historical changes,
    just the current modified state relative to the original.
    """

    id: str = Field(default_factory=lambda: str(uuid4()), primary_field=True)
    target_id: str = Field(index=True)  # condition_id
    target_type: ModificationTargetType
    field_name: str  # The field that was modified
    original_value: Any | None = None  # Original value from the source object
    current_value: Any  # Current modified value
    user_id: str = Field(index=True)  # ID of the last user who modified this field
    user_email: EmailStr  # Email of the last user who modified this field
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {
        "indexes": lambda: [
            Index(
                FieldModification.target_id,
                FieldModification.target_type,
                FieldModification.field_name,
                unique=True,  # Only one modification per field
            )
        ]
    }
