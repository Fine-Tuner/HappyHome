from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.enums import CommentTargetType


class CommentBase(BaseModel):
    target_id: str  # condition_id or block_id
    target_type: CommentTargetType
    announcement_id: str
    content: str


class CommentCreate(CommentBase):
    user_id: str
    user_email: EmailStr


class CommentUpdate(BaseModel):
    content: str


class CommentResponse(CommentBase):
    id: str
    user_id: str
    user_email: EmailStr
    created_at: datetime
    updated_at: datetime
