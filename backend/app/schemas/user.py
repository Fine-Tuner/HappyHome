from datetime import datetime, timezone

from pydantic import BaseModel, EmailStr, Field

from app.models.user import User


class UserCreate(BaseModel):
    google_id: str
    email: EmailStr | None = None
    first_name: str | None = None
    last_name: str | None = None
    display_name: str | None = None
    picture: str | None = None
    is_active: bool = True
    is_superuser: bool = False


# TODO: update user's profile when user's profile is updated
class UserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    display_name: str | None = None
    picture: str | None = None
    income: int | None = None
    bookmark_announcement_ids: list[str] | None = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserResponse(BaseModel):
    income: int | None = None
    bookmark_announcement_ids: list[str] | None = None

    @classmethod
    def from_model(cls, user: User) -> "UserResponse":
        return cls(
            income=user.income,
            bookmark_announcement_ids=user.bookmark_announcement_ids,
        )


class UserUpdateRequest(BaseModel):
    income: int | None = None
    bookmark_announcement_ids: list[str] | None = None
