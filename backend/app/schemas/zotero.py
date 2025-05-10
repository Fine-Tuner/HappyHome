from pydantic import BaseModel

from app.models.condition import Condition
from app.models.user_condition import UserCondition


class ZoteroAnnotation(BaseModel):
    class Position(BaseModel):
        pageIndex: int  # condition.page
        rects: list[float]  # condition.bbox

    authorName: str = "User"
    color: str
    comment: str
    dateCreated: str  # condition.created_at
    dateModified: str  # condition.updated_at
    id: str | None = None
    original_id: str | None = None
    isAuthorNameAuthoritative: bool = True
    pageLabel: str  # str(pageIndex + 1)
    position: Position
    sortIndex: str | None = None
    tags: list[str]  # condition.category
    text: str  # condition.content
    type: str = "highlight"

    @classmethod
    def from_condition(
        cls, condition: Condition, default_color: str
    ) -> "ZoteroAnnotation | None":
        """Creates a ZoteroAnnotation from a base Condition object."""
        return cls(
            id=None,
            original_id=condition.id,
            text=condition.content,
            comment="",  # Base conditions don't have user comments
            dateCreated=condition.created_at.isoformat(),
            dateModified=condition.created_at.isoformat(),  # Use created_at as modified
            pageLabel=str(condition.page + 1),
            position=cls.Position(pageIndex=condition.page, rects=condition.bbox),
            tags=[condition.category_id] if condition.category_id else [],
            color=default_color,
        )

    @classmethod
    def from_user_condition(
        cls, user_condition: UserCondition
    ) -> "ZoteroAnnotation | None":
        """Creates a ZoteroAnnotation from a UserCondition object."""
        return cls(
            id=user_condition.id,
            original_id=user_condition.original_id,
            text=user_condition.content,
            comment=user_condition.comment,
            dateCreated=user_condition.created_at.isoformat(),
            dateModified=user_condition.updated_at.isoformat(),
            pageLabel=str(user_condition.page + 1),
            position=cls.Position(
                pageIndex=user_condition.page, rects=user_condition.bbox
            ),
            tags=[user_condition.category_id] if user_condition.category_id else [],
            color=user_condition.color,
        )
