from datetime import datetime

from pydantic import BaseModel

from app.models.comment import Comment


class CommentCreate(BaseModel):
    question_id: str
    content: str
    user_id: str


class CommentUpdate(BaseModel):
    content: str | None = None
    upvotes: int | None = None
    is_deleted: bool | None = None


class CommentCreateRequest(BaseModel):
    question_id: str
    content: str


class CommentUpdateRequest(BaseModel):
    id: str
    content: str | None = None
    upvotes: int | None = None
    is_deleted: bool | None = None


class CommentResponse(BaseModel):
    id: str
    question_id: str
    content: str
    user_id: str  # user_name
    upvotes: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_model(cls, comment: Comment) -> "CommentResponse":
        return cls(
            id=comment.id,
            question_id=comment.question_id,
            content=comment.content,
            user_id=comment.user_id,
            upvotes=comment.upvotes,
            is_deleted=comment.is_deleted,
            created_at=comment.created_at,
            updated_at=comment.updated_at,
        )
