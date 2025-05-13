from datetime import datetime, timezone

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    google_id: str
    email: EmailStr | None = None
    first_name: str | None = None
    last_name: str | None = None
    display_name: str | None = None
    picture: str | None = None
    is_active: bool = True
    is_superuser: bool = False


class UserUpdate(UserCreate):
    email: EmailStr | None = None
    first_name: str | None = None
    last_name: str | None = None
    display_name: str | None = None
    picture: str | None = None
    updated_at: datetime = Field(default_factory=datetime.now(timezone.utc).isoformat())
