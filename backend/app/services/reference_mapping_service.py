import logging  # Import logging

import fitz
from openai.types.responses import Response
from PIL import Image

from app.core.openai_client import openai_client
from app.models.announcement import Announcement
from app.models.layout import Layout
from app.models.llm_output import LLMOutput
from app.pdf_analysis.llm_content_parsers import parse_and_validate_openai_response
from app.pdf_analysis.prompts import (
    REFERENCE_MAPPING_DEVELOPER_PROMPT,
    REFERENCE_MAPPING_USER_PROMPT,
)
from app.pdf_analysis.schemas import (
    ConditionItem,
    ConditionReferenceItem,
    ConditionReferenceItemsInPage,
    PublicLeaseCategory,
    ReferenceMappingResponse,
)
from app.pdf_analysis.utils import pil_image_to_base64, pixmap_to_image
from app.schemas.layout import Block, BlockType


def reference_mapping_sanity_check(
    res: ReferenceMappingResponse, blocks: list[Block], conditions: list[ConditionItem]
):
    assert res.num_blocks == len(blocks)
    assert res.num_conditions == len(conditions)

    for condition in res.conditions:
        assert len(condition.blocks) > 0, f"Condition {condition} has no blocks"
        for block in condition.blocks:
            assert block.block_index < len(blocks)
            # TODO: implement block type check, 'text' in [...], 'table' in [...]


def perform_reference_mapping_page(
    page: fitz.Page,
    page_blocks: list[Block],
    page_conditions: list[ConditionItem],
    image: Image.Image,
    width: int,
    height: int,
    max_retries: int = 3,
    model: str = "gpt-4o-mini",
):
    contents = []
    contents.append(
        {
            "type": "input_text",
            "text": "<BLOCKS>",
        }
    )
    block_contents = []
    for i, block in enumerate(page_blocks):
        bbox = [
            int(block.bbox[0] * width),
            int(block.bbox[1] * height),
            int(block.bbox[2] * width),
            int(block.bbox[3] * height),
        ]
        if block.type in [BlockType.TABLE, BlockType.FIGURE]:
            cropped_image = image.crop(bbox)
            cropped_image_base64 = pil_image_to_base64(cropped_image, "png")
            contents.append({"type": "input_text", "text": f"block_index: {i}"})
            contents.append(
                {
                    "type": "input_image",
                    "image_url": f"data:image/jpeg;base64,{cropped_image_base64}",
                }
            )
            block_contents.append(cropped_image)
        else:
            rect = fitz.Rect(bbox)
            text = page.get_textbox(rect)
            contents.append({"type": "input_text", "text": f"block_index: {i}"})
            contents.append({"type": "input_text", "text": text})
            block_contents.append(text)
    contents.append(
        {
            "type": "input_text",
            "text": "</BLOCKS>",
        }
    )

    contents.append(
        {
            "type": "input_text",
            "text": "<CONDITIONS>",
        }
    )
    for j, condition in enumerate(page_conditions):
        contents.append({"type": "input_text", "text": f"condition_index: {j}"})
        contents.append({"type": "input_text", "text": f"{condition.content}"})
    contents.append(
        {
            "type": "input_text",
            "text": "</CONDITIONS>",
        }
    )

    initial_response: Response = openai_client.responses.create(
        model=model,
        input=[
            {
                "role": "developer",
                "content": REFERENCE_MAPPING_DEVELOPER_PROMPT,
            },
            {
                "role": "user",
                "content": REFERENCE_MAPPING_USER_PROMPT,
            },
            {"role": "user", "content": contents},
        ],
    )

    try:
        result = parse_and_validate_openai_response(
            response=initial_response,
            validation_model=ReferenceMappingResponse,
            model=model,
            max_retries=max_retries,
        )
        # TODO: implement retry logic
        reference_mapping_sanity_check(result, page_blocks, page_conditions)

    except RuntimeError as e:
        logging.error(
            f"Failed to get and validate reference mapping response for page {page.number + 1}: {e}",
            exc_info=True,
        )
        raise RuntimeError(
            f"Failed reference mapping on page {page.number + 1}: {e}"
        ) from e
    except Exception as e:
        logging.error(
            f"Unexpected error after LLM response processing for page {page.number + 1}: {e}",
            exc_info=True,
        )
        raise RuntimeError(
            f"Unexpected error during reference mapping on page {page.number + 1}: {e}"
        ) from e

    processed_conditions = []
    for i, condition_data in enumerate(result.conditions):
        blocks_for_condition = []

        for block_ref in condition_data.blocks:
            block_index = block_ref.block_index
            if 0 <= block_index < len(page_blocks):
                blocks_for_condition.append(page_blocks[block_index])
            else:
                logging.error(
                    f"Invalid block_index {block_index} encountered on page {page.number + 1} for condition {i} after validation."
                )
                raise ValueError(
                    f"Invalid block_index {block_index} found after validation."
                )

        if i < len(page_conditions):
            item = ConditionReferenceItem(
                condition=page_conditions[i], blocks=blocks_for_condition
            )
            processed_conditions.append(item)
        else:
            logging.error(
                f"Condition index mismatch on page {page.number + 1}. LLM condition index {i} out of bounds for {len(page_conditions)} page conditions."
            )
            raise ValueError(f"Condition index {i} mismatch after validation.")

    return ConditionReferenceItemsInPage(
        page_number=page.number + 1, items=processed_conditions
    )


def _flatten_conditions(content: list[PublicLeaseCategory]) -> list[ConditionItem]:
    """Flattens the hierarchical condition structure from LLM output."""
    flattened_conditions = []
    for category in content:
        category_name = category.category
        for item in category.items:
            item_label = item.label
            for condition in item.conditions:
                flat_condition = ConditionItem(
                    content=condition.content,
                    section=condition.section,
                    category=category_name,
                    label=item_label,
                    pages=condition.pages,
                )
                flattened_conditions.append(flat_condition)
    return flattened_conditions


def perform_reference_mapping_doc(
    announcement: Announcement,
    layout: Layout,
    llm_output: LLMOutput,
) -> dict | None:
    """
    Performs reference mapping for the entire document using an 'all or nothing' approach.
    If any error occurs during file opening or page processing, logs the error and returns None.

    Args:
        announcement: The announcement object containing file path.
        layout: The layout object containing blocks and dimensions.
        llm_output: The LLM output containing conditions.

    Returns:
        On success: A dictionary containing:
            - "results": A list of ConditionReferenceItemsInPage objects.
            - "errors": An empty list.
        On failure (file opening or page processing error): None.
    """
    width = layout.width
    height = layout.height
    blocks = layout.blocks
    # Flatten conditions using the helper function
    try:
        conditions = _flatten_conditions(llm_output.content)
    except Exception as flatten_err:
        logging.error(
            f"Error flattening conditions for {announcement.file_path}: {flatten_err}",
            exc_info=True,
        )
        return None

    if not conditions:
        logging.warning(f"No conditions found to process for {announcement.file_path}")
        return {"results": [], "errors": []}

    results = []
    doc = None
    page_number = None

    try:
        try:
            doc = fitz.open(announcement.file_path)
        except FileNotFoundError:
            logging.error(f"File not found: {announcement.file_path}")
            return None
        except Exception as e:
            logging.error(f"Error opening PDF {announcement.file_path}: {e}")
            return None

        for page in doc:
            page_number = page.number + 1
            page_blocks = [block for block in blocks if block.page == page_number]

            # Filter the flattened conditions for the current page
            page_conditions = [
                condition for condition in conditions if page_number in condition.pages
            ]

            if not page_conditions:
                continue

            # Check if there are blocks on the page to avoid errors if page is empty
            if not page_blocks:
                logging.warning(
                    f"Skipping page {page_number}: No blocks found in layout for {announcement.file_path}."
                )
                continue

            try:
                image = pixmap_to_image(page.get_pixmap())
                conditions_in_page = perform_reference_mapping_page(
                    page=page,
                    page_blocks=page_blocks,
                    page_conditions=page_conditions,
                    image=image,
                    width=width,
                    height=height,
                )
                results.append(conditions_in_page)
            except Exception as page_err:
                error_msg = f"Error processing page {page_number}: {page_err}"
                logging.error(
                    f"{error_msg} (File: {announcement.file_path})", exc_info=True
                )
                if doc:
                    try:
                        doc.close()
                    except Exception as close_err:
                        logging.error(
                            f"Error closing PDF during page error handling {announcement.file_path}: {close_err}"
                        )
                return None

        return {"results": results, "errors": []}

    except RuntimeError as e:
        error_msg = f"RuntimeError processing page {page_number}: {e}"
        logging.error(f"{error_msg} (File: {announcement.file_path})")
        return None
    except Exception as e:
        context = (
            f"processing page {page_number}"
            if page_number is not None
            else "during document processing setup"
        )
        error_msg = f"Unexpected error {context}: {e}"
        logging.error(f"{error_msg} (File: {announcement.file_path})", exc_info=True)
        return None
    finally:
        if doc:
            try:
                doc.close()
            except Exception as e:
                logging.error(
                    f"Error closing PDF document {announcement.file_path}: {e}"
                )
