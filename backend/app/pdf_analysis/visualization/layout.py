import fitz

from app.models.block import Block
from app.pdf_analysis.utils import copy_fitz_document, pixmap_to_image
from app.schemas.block import BlockType

COLORS = {
    BlockType.TITLE: (1, 0, 0),
    BlockType.PLAIN_TEXT: (0, 1, 0),
    BlockType.ABANDON: (0, 0, 1),
    BlockType.FIGURE: (1, 1, 0),
    BlockType.FIGURE_CAPTION: (0, 1, 1),
    BlockType.TABLE: (1, 0.5, 0),
    BlockType.TABLE_CAPTION: (0.5, 0, 0.5),
    BlockType.TABLE_FOOTNOTE: (0.5, 0.5, 0),
    BlockType.ISOLATE_FORMULA: (0.5, 0, 0),
    BlockType.FORMULA_CAPTION: (0, 0.5, 0.5),
}


def visualize_layout(
    doc: fitz.Document,
    blocks: list[Block],
    output_path: str | None = None,
    inplace: bool = False,
) -> fitz.Document:
    """
    Adds a side panel to the right of each page in the PDF associated
    with the layout of the blocks.

    Args:
        doc: The PDF document to visualize the layout on.
        blocks: A list of Block objects.
        output_path: The path to save the output PDF.
        inplace: Whether to modify the original document in place.

    Returns:
        A new fitz.Document with wider pages containing the original content
        and a panel on the right populated with blocks.
    """
    if not inplace:
        doc = copy_fitz_document(doc)

    rect_width = 1.5
    font_size = 8
    text_color = (0, 0, 1)

    for page in doc:
        page_number = page.number + 1
        image = pixmap_to_image(page.get_pixmap())
        page_blocks = [block for block in blocks if block.page == page_number]

        for block in page_blocks:
            rect_color = COLORS[block.type]
            rel_bbox = block.bbox
            abs_bbox = [
                rel_bbox[0] * image.width,
                rel_bbox[1] * image.height,
                rel_bbox[2] * image.width,
                rel_bbox[3] * image.height,
            ]
            rect = fitz.Rect(*abs_bbox)
            # add block type above the rectangle
            page.draw_rect(rect, color=rect_color, width=rect_width)
            page.insert_text(
                rect.tl,
                block.type.name,
                fontsize=font_size,
                color=text_color,
            )

    if output_path:
        doc.save(output_path)

    return doc
