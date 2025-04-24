from pydantic import BaseModel


class ConditionCreate(BaseModel):
    announcement_id: str
    llm_output_id: str
    content: str
    section: str
    category: str
    pages: list[int]


class ConditionUpdate(BaseModel):
    pass
