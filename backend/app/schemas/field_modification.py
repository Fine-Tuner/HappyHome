from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr

from app.enums import ModificationTargetType


class FieldModificationBase(BaseModel):
    target_id: str  # condition_id
    target_type: ModificationTargetType
    field_name: str
    original_value: Any | None = None
    current_value: Any


class FieldModificationCreate(FieldModificationBase):
    user_id: str
    user_email: EmailStr


class FieldModificationUpdate(BaseModel):
    current_value: Any
    user_id: str
    user_email: EmailStr


class FieldModificationResponse(FieldModificationBase):
    id: str
    user_id: str
    user_email: EmailStr
    created_at: datetime
    updated_at: datetime
