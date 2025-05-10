from pydantic import BaseModel


class ConditionBase(BaseModel):
    announcement_id: str
    llm_output_id: str
    category_id: str
    content: str
    section: str
    page: int
    bbox: list[float]


class ConditionCreate(ConditionBase):
    pass


class ConditionUpdate(BaseModel):
    content: str
