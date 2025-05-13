from pydantic import BaseModel, EmailStr

from app.utils.decorators import not_implemented


class UserCreate(BaseModel):
    email: EmailStr
    is_active: bool | None = True
    is_superuser: bool | None = False
    full_name: str | None = None


@not_implemented
class UserUpdate(UserCreate):
    pass
