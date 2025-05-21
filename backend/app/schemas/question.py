from datetime import datetime

from pydantic import BaseModel

from app.models.question import Question


class QuestionCreate(BaseModel):
    title: str
    content: str
    user_id: str


class QuestionUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    upvotes: int | None = None
    is_deleted: bool | None = None


class QuestionCreateRequest(BaseModel):
    title: str
    content: str


class QuestionUpdateRequest(BaseModel):
    id: str
    title: str | None = None
    content: str | None = None
    upvotes: int | None = None


class QuestionResponse(BaseModel):
    id: str
    title: str
    content: str
    user_id: str
    upvotes: int
    views: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_model(cls, question: Question) -> "QuestionResponse":
        return cls(
            id=question.id,
            title=question.title,
            content=question.content,
            user_id=question.user_id,
            upvotes=question.upvotes,
            views=question.views,
            is_deleted=question.is_deleted,
            created_at=question.created_at,
            updated_at=question.updated_at,
        )
