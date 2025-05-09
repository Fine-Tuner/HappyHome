from typing import Any

import fitz
from doclayout_yolo import YOLOv10

from app.crud import crud_block
from app.pdf_analysis.layout_parsers import parse_layout_from_image
from app.pdf_analysis.utils import pixmap_to_image
from app.schemas.block import BlockCreate


async def perform_layout_parsing(
    announcement_id: str,
    pdf_path: str,
    db_engine: Any,
    model: YOLOv10,
    crud_block: Any = crud_block,
):
    doc = None
    try:
        doc = fitz.open(pdf_path)
        if len(doc) == 0:
            print(f"No pages found in PDF {pdf_path}")
            return

        all_blocks = []
        for page_index, page in enumerate(doc):
            page_num = page_index + 1

            try:
                pix = page.get_pixmap()
                image = pixmap_to_image(pix)
                page_blocks = parse_layout_from_image(image, page_num, model)
                all_blocks.extend(page_blocks)
            except Exception as e:
                print(f"Error processing page {page_num} of doc {pdf_path}: {e}")
                # Continue to the next page if one fails
                return

        block_ins = []
        for block in all_blocks:
            block_in = BlockCreate(
                page=block.page,
                bbox=block.bbox,
                type=block.type,
                confidence=block.confidence,
                model=block.model,
                announcement_id=announcement_id,
            )
            block_ins.append(block_in)
        blocks_created = await crud_block.create_many(db_engine, objs_in=block_ins)
        return blocks_created

    except Exception as e:
        print(f"Error during layout analysis: {e}")
        return
    finally:
        if doc:
            doc.close()
