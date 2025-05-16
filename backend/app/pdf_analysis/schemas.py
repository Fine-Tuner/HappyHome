from pydantic import BaseModel


class PublicLeaseCondition(BaseModel):
    content: str
    section: str
    page: int
    bbox: list[list[float]]


class PublicLeaseCategory(BaseModel):
    category: str
    conditions: list[PublicLeaseCondition]


PublicLeaseOutput = list[PublicLeaseCategory]


class ReferenceMappingCondition(BaseModel):
    content: str
    block_indices: list[int]


class ReferenceMappingResponse(BaseModel):
    num_blocks: int
    num_conditions: int
    conditions: list[ReferenceMappingCondition]
