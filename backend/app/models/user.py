from datetime import datetime, timezone
from uuid import uuid4

from odmantic import Field, Model
from pydantic import EmailStr


class User(Model):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_field=True)
    full_name: str = Field(default="")
    email: EmailStr
    is_active: bool = Field(default=True)
    is_superuser: bool = Field(default=False)
    refresh_tokens: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
