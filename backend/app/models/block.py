from uuid import uuid4

from odmantic import Field, Model

from app.enums import BlockType


class Block(Model):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_field=True)
    announcement_id: str = Field(index=True)
    page: int = Field(index=True)
    bbox: list[float]  # [x1, y1, x2, y2] normalized coordinates [0, 1]
    type: BlockType
    confidence: float
    model: str
