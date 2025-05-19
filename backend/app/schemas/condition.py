from pydantic import BaseModel

from app.utils.decorators import not_implemented


class ConditionCreate(BaseModel):
    announcement_id: str
    llm_output_id: str
    category_id: str
    content: str
    section: str
    page: int
    bbox: list[list[float]]


@not_implemented
class ConditionUpdate(BaseModel):
    pass


class ConditionCreateRequest(BaseModel):
    announcement_id: str
    category_id: str
    content: str
    page: int
    bbox: list[list[float]]
    comment: str = ""
    color: str = "#000000"
    # user_id will be injected by the endpoint/dependency


class ConditionUpdateRequest(BaseModel):
    category_id: str | None = None
    original_condition_id: str | None = None
    user_condition_id: str | None = None

    content: str | None = None
    page: int | None = None
    bbox: list[list[float]] | None = None
    comment: str | None = None
    color: str | None = None


class ConditionDeleteRequest(BaseModel):
    original_condition_id: str | None = None
    user_condition_id: str | None = None
