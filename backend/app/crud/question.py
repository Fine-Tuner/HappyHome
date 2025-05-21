from typing import Any

from odmantic import AIOEngine

from app.crud.base import CRUDBase
from app.models.question import Question
from app.schemas.question import QuestionCreate, QuestionUpdate


class CRUDQuestion(CRUDBase[Question, QuestionCreate, QuestionUpdate]):
    def delete(self, engine: AIOEngine, *args: Any) -> int:
        raise NotImplementedError("Delete operation is not implemented for questions.")

    def delete_many(self, engine: AIOEngine, *args: Any) -> int:
        raise NotImplementedError(
            "Delete_many operation is not implemented for questions."
        )


crud_question = CRUDQuestion(Question)
