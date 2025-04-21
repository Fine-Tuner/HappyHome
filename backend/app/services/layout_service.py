from typing import Any

import fitz
from doclayout_yolo import YOLOv10

from app.crud import crud_announcement, crud_layout
from app.pdf_analysis.layout_parsers import parse_layout_from_image
from app.pdf_analysis.utils import pixmap_to_image
from app.schemas.layout import LayoutCreate


async def perform_layout_analysis(announcement_id: str, db_engine: Any, model: YOLOv10):
    ann = await crud_announcement.get(db_engine, {"_id": announcement_id})
    if not ann or not ann.file_path:
        print(f"Announcement {announcement_id} not found or has no file path.")
        return

    pdf_path = ann.file_path
    doc = None
    try:
        doc = fitz.open(pdf_path)
        if len(doc) == 0:
            print(f"No pages found in PDF {pdf_path}")
            return

        all_blocks = []
        first_page = doc[0]
        page_width = first_page.rect.width
        page_height = first_page.rect.height

        for page_index, page in enumerate(doc):
            page_num = page_index + 1

            try:  # Add try/except block for individual page processing
                pix = page.get_pixmap()
                image = pixmap_to_image(pix)
                # Pass page_num to the parser
                page_blocks = parse_layout_from_image(image, page_num, model)
                # No need to set block.page here anymore as it's done in the parser
                all_blocks.extend(page_blocks)
            except Exception as e:
                print(f"Error processing page {page_num} of doc {pdf_path}: {e}")
                # Continue to the next page if one fails
                return

        layout_in = LayoutCreate(
            announcement_id=announcement_id,
            width=page_width,
            height=page_height,
            blocks=all_blocks,
        )
        return await crud_layout.create(db_engine, obj_in=layout_in)

    except Exception as e:
        print(f"Error during layout analysis: {e}")
        # Consider specific exception handling
        return None  # Or raise an exception
    finally:
        if doc:
            doc.close()
