from pydantic import BaseModel

from app.schemas.layout import Block


class ReferenceMappingBlock(BaseModel):
    block_index: int
    type: str


class ReferenceMappingCondition(BaseModel):
    content: str
    blocks: list[ReferenceMappingBlock]


class ReferenceMappingResponse(BaseModel):
    num_blocks: int
    num_conditions: int
    conditions: list[ReferenceMappingCondition]


class ConditionItem(BaseModel):
    content: str
    section: str
    category: str
    label: str
    pages: list[int]


class ConditionReferenceItem(BaseModel):
    condition: ConditionItem
    blocks: list[Block]


class ConditionReferenceItemsInPage(BaseModel):
    page_number: int
    items: list[ConditionReferenceItem]


class PublicLeaseCondition(BaseModel):
    content: str
    section: str
    pages: list[int]


class PublicLeaseItem(BaseModel):
    label: str
    conditions: list[PublicLeaseCondition]


class PublicLeaseCategory(BaseModel):
    category: str
    items: list[PublicLeaseItem]


PublicLeaseOutput = list[PublicLeaseCategory]
