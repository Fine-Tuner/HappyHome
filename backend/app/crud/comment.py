from odmantic import AIOEngine

from app.crud.base import CRUDBase
from app.enums import CommentTargetType
from app.models.comment import Comment
from app.schemas.comment import CommentCreate, CommentUpdate


class CRUDComment(CRUDBase[Comment, CommentCreate, CommentUpdate]):
    async def get_by_target(
        self, engine: AIOEngine, target_id: str, target_type: CommentTargetType
    ) -> list[Comment]:
        return await self.get_many(
            engine,
            (Comment.target_id == target_id) & (Comment.target_type == target_type),
        )

    async def get_by_announcement(
        self, engine: AIOEngine, announcement_id: str
    ) -> list[Comment]:
        return await self.get_many(engine, Comment.announcement_id == announcement_id)


crud_comment = CRUDComment(Comment)
