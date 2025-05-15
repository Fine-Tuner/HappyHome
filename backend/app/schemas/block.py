from pydantic import BaseModel, Field

from app.enums import BlockType


class BlockBase(BaseModel):
    page: int
    bbox: list[float] = Field(
        ..., min_items=4, max_items=4
    )  # [x1, y1, x2, y2] normalized coordinates [0, 1]
    type: BlockType
    confidence: float
    model: str


class BlockCreate(BlockBase):
    announcement_id: str


class BlockUpdate(BaseModel):
    page: int | None = None
    bbox: list[float] | None = None
    type: BlockType | None = None
    confidence: float | None = None
    model: str | None = None


class BlockResponse(BlockBase):
    id: str
    announcement_id: str
