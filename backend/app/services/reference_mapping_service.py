import logging  # Import logging
from typing import Any

import fitz
from openai.types.responses import Response

from app.core.openai_client import openai_client
from app.models.announcement import Announcement
from app.models.block import Block
from app.models.condition import Condition
from app.models.reference_link import ReferenceLink
from app.pdf_analysis.llm_content_parsers import parse_and_validate_openai_response
from app.pdf_analysis.prompts import (
    REFERENCE_MAPPING_DEVELOPER_PROMPT,
    REFERENCE_MAPPING_USER_PROMPT,
)
from app.pdf_analysis.schemas import ReferenceMappingResponse
from app.pdf_analysis.utils import pil_image_to_base64, pixmap_to_image


def perform_reference_mapping_page(
    announcement_id: str,
    page: fitz.Page,
    page_blocks: list[Block],
    page_conditions: list[Condition],
    model: str = "gpt-4o-mini",
    max_retries: int = 3,
) -> list[ReferenceLink]:
    """
    Performs reference mapping for a single page using LLM.

    Args:
        announcement_id: ID of the announcement.
        page: The fitz.Page object.
        page_blocks: List of Block models for this page.
        page_conditions: List of Condition models relevant to this page.
        image: PIL Image of the page.
        width: Original page width.
        height: Original page height.
        db_engine: Odmantic engine instance.
        mapping_model: OpenAI model for mapping.
        max_retries: Max retries for LLM parsing.

    Returns:
        List of ConditionBlockLink objects created for this page.

    Raises:
        RuntimeError: If LLM call or parsing fails critically.
        ValueError: If validation fails (e.g., bad indices from LLM).
    """
    if not page_blocks or not page_conditions:
        return []

    image = pixmap_to_image(page.get_pixmap())

    contents = []
    # Blocks
    contents.append({"type": "input_text", "text": "<BLOCKS>"})
    block_map = {i: block for i, block in enumerate(page_blocks)}  # Map index to block
    for i, block in enumerate(page_blocks):
        bbox = [
            int(block.bbox[0] * image.width),
            int(block.bbox[1] * image.height),
            int(block.bbox[2] * image.width),
            int(block.bbox[3] * image.height),
        ]
        if block.type.value in ["TABLE", "FIGURE"]:
            cropped_image = image.crop(bbox)
            cropped_image_base64 = pil_image_to_base64(cropped_image, "png")
            contents.append({"type": "input_text", "text": f"block_index: {i}"})
            contents.append(
                {
                    "type": "input_image",
                    "image_url": f"data:image/jpeg;base64,{cropped_image_base64}",
                }
            )
        else:
            rect = fitz.Rect(bbox)
            text = page.get_textbox(rect)
            contents.append({"type": "input_text", "text": f"block_index: {i}"})
            contents.append(
                {"type": "input_text", "text": text or "[Empty Text Block]"}
            )
    contents.append({"type": "input_text", "text": "</BLOCKS>"})

    # Conditions
    contents.append({"type": "input_text", "text": "<CONDITIONS>"})
    condition_map = {i: cond for i, cond in enumerate(page_conditions)}
    for j, condition in enumerate(page_conditions):
        contents.append({"type": "input_text", "text": f"condition_index: {j}"})
        contents.append({"type": "input_text", "text": f"{condition.content}"})
    contents.append({"type": "input_text", "text": "</CONDITIONS>"})

    try:
        initial_response: Response = openai_client.responses.create(
            model=model,
            temperature=0.0,
            top_p=1,
            input=[
                {"role": "developer", "content": REFERENCE_MAPPING_DEVELOPER_PROMPT},
                {"role": "user", "content": REFERENCE_MAPPING_USER_PROMPT},
                {"role": "user", "content": contents},
            ],
        )
        result = parse_and_validate_openai_response(
            response=initial_response,
            validation_model=ReferenceMappingResponse,
            model=model,
            max_retries=max_retries,
        )
    except RuntimeError as e:
        logging.error(
            f"LLM call/parsing failed for reference mapping on page {page.number + 1}: {e}",
            exc_info=True,
        )
        raise

    # --- Process results into ConditionBlockLink objects ---
    links_to_create = []
    llm_conditions = result.conditions

    if result.num_conditions != len(page_conditions):
        logging.warning(
            f"LLM condition count ({result.num_conditions}) mismatch with input ({len(page_conditions)}) on page {page.number + 1}. Proceeding cautiously."
        )

    for llm_cond_index, condition_data in enumerate(llm_conditions):
        if llm_cond_index >= len(page_conditions):
            logging.warning(
                f"Skipping LLM condition index {llm_cond_index} (out of bounds) on page {page.number + 1}"
            )
            continue

        # Get the original Condition model using the index map
        original_condition = condition_map.get(llm_cond_index)
        if not original_condition:
            # This shouldn't happen if index < len(page_conditions) but check anyway
            logging.error(
                f"Internal map error: Condition index {llm_cond_index} not found."
            )
            continue

        if not condition_data.blocks:
            logging.warning(
                f"LLM returned no blocks for condition index {llm_cond_index} ('{original_condition.content[:50]}...') on page {page.number + 1}"
            )
            continue

        for block_ref in condition_data.blocks:
            block_index = block_ref.block_index
            target_block = block_map.get(block_index)

            if target_block:
                link = ReferenceLink(
                    announcement_id=announcement_id,
                    condition_id=original_condition.id,
                    block_id=target_block.id,
                )
                links_to_create.append(link)
            else:
                logging.error(
                    f"Invalid block_index {block_index} from LLM for condition index {llm_cond_index} on page {page.number + 1}."
                )
                # Or uncomment below to make it fatal for the page:
                # raise ValueError(f"Invalid block_index {block_index} received from LLM.")

    return links_to_create


async def perform_reference_mapping_doc(
    announcement: Announcement,
    blocks: list[Block],
    db_engine: Any,
    crud_condition: Any,
    crud_block: Any,
    crud_reference_link: Any,
    model: str = "gpt-4o-mini",
) -> list[ReferenceLink] | None:
    """
    Performs reference mapping for the entire document by processing page by page.
    Fetches necessary Blocks and Conditions from the database.
    Saves ConditionBlockLink objects for successful mappings.

    Args:
        announcement: The announcement object.
        layout: The layout object (used for width/height).
        llm_output: The LLM output object (used for ID).
        db_engine: Odmantic engine instance.
        mapping_model: Model to use for the mapping LLM calls.

    Returns:
        A list of all ConditionBlockLink objects created for the document,
        or None if a critical error occurred (e.g., file opening, DB error).
    """
    conditions = await crud_condition.get_many(
        db_engine,
        {"announcement_id": announcement.id},
    )
    blocks = await crud_block.get_many(
        db_engine,
        {"announcement_id": announcement.id},
    )
    assert len(conditions) > 0, f"No conditions found in DB for Ann: {announcement.id}"
    assert len(blocks) > 0, f"No blocks found in DB for announcement: {announcement.id}"

    all_links_in = []
    page_number = None

    try:
        doc = fitz.open(announcement.file_path)
    except FileNotFoundError:
        logging.error(f"File not found for mapping: {announcement.file_path}")
        return
    except Exception as e:
        logging.error(f"Error opening PDF {announcement.file_path} for mapping: {e}")
        return
    try:
        for page in doc:
            page_number = page.number + 1

            current_page_blocks = []
            current_page_conditions = []

            for block in blocks:
                if block.page == page_number:
                    current_page_blocks.append(block)

            for cond in conditions:
                if page_number in cond.pages:
                    current_page_conditions.append(cond)

            if not current_page_conditions:
                logging.info(f"No conditions relevant to page {page_number}.")
                continue

            assert len(current_page_blocks) > 0, (
                f"A page should have at least one block: {announcement.id}."
            )

            try:
                page_links = perform_reference_mapping_page(
                    announcement_id=announcement.id,
                    page=page,
                    page_blocks=current_page_blocks,
                    page_conditions=current_page_conditions,
                    model=model,
                )
                all_links_in.extend(page_links)
                logging.info(
                    f"Processed page {page_number}, created {len(page_links)} links."
                )

            except (RuntimeError, ValueError, TypeError) as page_err:
                # Errors from page function (LLM failure, validation error)
                error_msg = f"Critical error processing page {page_number} for mapping: {page_err}"
                logging.error(
                    f"{error_msg} (File: {announcement.file_path})", exc_info=True
                )
                # Make page-level errors fatal for the whole document process?
                # For 'all or nothing', return None here.
                if doc:
                    doc.close()  # Attempt close before returning
                return
            except Exception as page_err:
                # Catch-all for unexpected errors during page processing
                error_msg = f"Unexpected error processing page {page_number} for mapping: {page_err}"
                logging.error(
                    f"{error_msg} (File: {announcement.file_path})", exc_info=True
                )
                if doc:
                    doc.close()
                return

        logging.info(
            f"Finished reference mapping for announcement: {announcement.id}. Total links created: {len(all_links_in)}"
        )
        links_created = await crud_reference_link.create_many(db_engine, all_links_in)
        return links_created  # Return all links created across pages

    except Exception as e:
        # Catch errors during setup/looping before page processing starts
        context = (
            f"Processing page {page_number}"
            if page_number is not None
            else "during mapping document setup"
        )
        error_msg = f"Unexpected error {context}: {e}"
        logging.error(f"{error_msg} (File: {announcement.file_path})", exc_info=True)
        return
    finally:
        if doc:
            doc.close()
