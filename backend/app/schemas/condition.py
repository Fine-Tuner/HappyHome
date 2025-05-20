from pydantic import BaseModel

from app.models.condition import Condition


class ConditionCreate(BaseModel):
    original_id: str | None = None
    llm_output_id: str | None = None
    announcement_id: str
    category_id: str | None = None
    user_id: str | None = None
    content: str | None = None
    section: str | None = None
    comment: str | None = None
    page: int
    bbox: list[list[float]]
    color: str | None = None
    is_deleted: bool = False


class ConditionUpdate(BaseModel):
    category_id: str | None = None
    content: str | None = None
    bbox: list[list[float]] | None = None
    comment: str | None = None
    color: str | None = None
    is_deleted: bool | None = None


class ConditionCreateRequest(BaseModel):
    announcement_id: str
    category_id: str | None = None
    content: str | None = None
    section: str | None = None
    page: int
    bbox: list[list[float]]
    comment: str | None = None
    color: str = "#ffd400"
    # user_id will be injected by the endpoint/dependency


class ConditionUpdateRequest(BaseModel):
    id: str
    content: str | None = None
    section: str | None = None
    page: int | None = None
    bbox: list[list[float]] | None = None
    comment: str | None = None
    color: str | None = None
    is_deleted: bool | None = None


class ConditionResponse(BaseModel):
    class Position(BaseModel):
        pageIndex: int
        rects: list[list[float]]

    id: str
    original_id: str | None = None
    category_id: str | None = None
    user_id: str | None = None
    text: str
    comment: str | None
    color: str | None
    dateCreated: str
    dateModified: str
    pageLabel: str
    position: Position
    is_deleted: bool
    tags: list[str]

    authorName: str = "User"
    isAuthorNameAuthoritative: bool = True
    sortIndex: str | None = None
    type: str = "highlight"

    @classmethod
    def from_model(cls, condition: Condition) -> "ConditionResponse":
        """Creates a ConditionResponse from a unified Condition object."""
        return cls(
            id=condition.id,
            original_id=condition.original_id,
            category_id=condition.category_id,
            user_id=condition.user_id,
            text=condition.content,
            comment=condition.comment,
            dateCreated=condition.created_at.isoformat(),
            dateModified=condition.updated_at.isoformat(),
            pageLabel=str(condition.page),
            position=cls.Position(pageIndex=condition.page - 1, rects=condition.bbox),
            is_deleted=condition.is_deleted,
            tags=[condition.category_id] if condition.category_id else [],
            color=condition.color,
        )
