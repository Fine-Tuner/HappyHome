from pydantic import BaseModel, Field

from app.enums import BlockType


class Block(BaseModel):
    type: BlockType
    page: int
    bbox: list[float] = Field(..., min_items=4, max_items=4)  # normalized bbox
    confidence: float
    model: str


class BlockCreate(BaseModel):
    block: Block
    announcement_id: str


class BlockUpdate(BaseModel):
    pass
