from app.crud.base import CRUDBase
from app.models.block import Block
from app.schemas.block import BlockCreate, BlockUpdate


class CRUDBlock(CRUDBase[Block, BlockCreate, BlockUpdate]):
    def _prepare_model_for_create(self, obj_in: BlockCreate) -> Block:
        db_obj = Block(
            announcement_id=obj_in.announcement_id,
            page=obj_in.block.page,
            bbox=obj_in.block.bbox,
            type=obj_in.block.type,
            confidence=obj_in.block.confidence,
            model=obj_in.block.model,
        )
        return db_obj


crud_block = CRUDBlock(Block)
