from datetime import datetime, timezone
from uuid import uuid4

from odmantic import Field, Index, Model
from pydantic import EmailStr

from app.enums import CommentTargetType


class Comment(Model):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_field=True)
    target_id: str = Field(index=True)  # condition_id or block_id
    target_type: CommentTargetType
    announcement_id: str = Field(index=True)
    content: str
    user_id: str = Field(index=True)
    user_email: EmailStr
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {
        "indexes": lambda: [
            Index(
                Comment.target_id,
                Comment.target_type,
                Comment.user_id,
            )
        ]
    }
