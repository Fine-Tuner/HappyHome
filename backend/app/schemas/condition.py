from pydantic import BaseModel

from app.models.condition import Condition


class ConditionBase(BaseModel):
    announcement_id: str
    llm_output_id: str
    content: str
    section: str
    category: str
    page: int


class ConditionCreate(ConditionBase):
    pass


class ConditionUpdate(BaseModel):
    content: str
    category: str


class ConditionRead(ConditionBase):
    @classmethod
    def from_model(cls, condition: Condition) -> "ConditionRead":
        return cls(
            announcement_id=condition.announcement_id,
            llm_output_id=condition.llm_output_id,
            content=condition.content,
            section=condition.section,
            category=condition.category,
            page=condition.page,
        )
