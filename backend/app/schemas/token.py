from pydantic import BaseModel

from app.utils.decorators import not_implemented


class RefreshTokenCreate(BaseModel):
    token: str


@not_implemented
class RefreshTokenUpdate(BaseModel):
    pass


class Token(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str


class TokenPayload(BaseModel):
    sub: str | None = None
    refresh: bool | None = False
