from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4

from odmantic import Field, Model
from pydantic import EmailStr


class User(Model):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_field=True)

    google_id: str = Field(index=True, unique=True)
    email: EmailStr | None = Field(default=None, index=True, unique=True)
    first_name: str | None = Field(default=None)
    last_name: str | None = Field(default=None)
    display_name: str | None = Field(default=None)
    picture: str | None = Field(default=None)
    provider: Literal["google"] = Field(default="google")

    income: int | None = Field(default=None)
    bookmark_announcement_ids: list[str] = Field(default_factory=list)

    is_active: bool = Field(default=True)
    is_superuser: bool = Field(default=False)
    refresh_tokens: list[str] = Field(default_factory=list)

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
