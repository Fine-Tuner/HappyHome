from pydantic import BaseModel

from app.utils.decorators import not_implemented


class ConditionCreate(BaseModel):
    announcement_id: str
    llm_output_id: str
    category_id: str
    content: str
    section: str
    page: int
    bbox: list[float]


@not_implemented
class ConditionUpdate(BaseModel):
    pass
