import logging
from typing import Any

import fitz
from openai import APIError
from openai.types.responses import Response

from app.core.config import settings
from app.core.openai_client import openai_client
from app.models.announcement import Announcement
from app.models.block import Block
from app.models.condition import Condition
from app.models.page_mapping_result import PageMappingStatus
from app.models.reference_link import ReferenceLink
from app.pdf_analysis.llm_content_parsers import parse_and_validate_openai_response
from app.pdf_analysis.prompts import (
    REFERENCE_MAPPING_DEVELOPER_PROMPT,
    REFERENCE_MAPPING_USER_PROMPT,
)
from app.pdf_analysis.schemas import ReferenceMappingResponse
from app.pdf_analysis.utils import pil_image_to_base64, pixmap_to_image
from app.schemas.page_mapping_result import PageMappingResultCreate


def perform_reference_mapping_page(
    announcement_id: str,
    page: fitz.Page,
    page_blocks: list[Block],
    page_conditions: list[Condition],
    model: str = "gpt-4o-mini",
    max_retries: int = 3,
) -> tuple[list[ReferenceLink], Response | None, Exception | None]:
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
        A tuple containing:
        - List of successfully generated ReferenceLink objects.
        - The raw Response object from the OpenAI API call (if successful).
        - An Exception object if an error occurred during API call or parsing, otherwise None.
    """
    if not page_blocks or not page_conditions:
        return [], None, None

    image = pixmap_to_image(page.get_pixmap())

    contents = []
    block_map = {}
    condition_map = {}

    # Blocks
    contents.append({"type": "input_text", "text": "<BLOCKS>"})
    block_map = {i: block for i, block in enumerate(page_blocks)}
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

    initial_response: Response | None = None
    links_to_create: list[ReferenceLink] = []

    try:
        initial_response = openai_client.responses.create(
            model=model,
            temperature=0.0,
            top_p=1,
            input=[
                {"role": "developer", "content": REFERENCE_MAPPING_DEVELOPER_PROMPT},
                {"role": "user", "content": REFERENCE_MAPPING_USER_PROMPT},
                {"role": "user", "content": contents},
            ],
        )
        content = initial_response.output_text
        if not content:
            logging.error(
                f"No content found in OpenAI response for page {page.number + 1}",
                exc_info=True,
            )
            return [], initial_response, None

        result = parse_and_validate_openai_response(
            content=content,
            validation_model=ReferenceMappingResponse,
            model=model,
            max_retries=max_retries,
        )

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
            original_condition = condition_map.get(llm_cond_index)
            if not original_condition:
                logging.error(
                    f"Internal map error: Condition index {llm_cond_index} not found."
                )
                continue
            for block_index in condition_data.block_indices:
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

        return links_to_create, initial_response, None

    except (APIError, RuntimeError, ValueError, TypeError) as e:
        error_type = type(e).__name__
        logging.error(
            f"{error_type} during reference mapping for page {page.number + 1}: {e}",
            exc_info=True,
        )
        return [], initial_response, e
    except Exception as e:
        logging.error(
            f"Unexpected error during reference mapping for page {page.number + 1}: {e}",
            exc_info=True,
        )
        return [], initial_response, e


async def perform_reference_mapping_doc(
    announcement: Announcement,
    db_engine: Any,
    crud_condition: Any,
    crud_block: Any,
    crud_reference_link: Any,
    crud_page_mapping_result: Any,
    model: str = "gpt-4o-mini",
) -> list[ReferenceLink] | None:
    """
    Performs reference mapping page by page, saving status and raw response for each page.
    Saves successfully generated ReferenceLink objects.

    Args:
        announcement: The announcement object.
        blocks: List of all blocks for the announcement.
        db_engine: Odmantic engine instance.
        crud_condition: CRUD service for conditions.
        crud_block: CRUD service for blocks.
        crud_reference_link: CRUD service for reference links.
        crud_page_mapping_result: CRUD service for page mapping results.
        model: Model to use for the mapping LLM calls.

    Returns:
        A list of ReferenceLink objects created, or None if a critical setup error occurs.
    """
    blocks = await crud_block.get_many(
        db_engine,
        {"announcement_id": announcement.id},
    )
    conditions = await crud_condition.get_many(
        db_engine,
        {"announcement_id": announcement.id},
    )

    if not conditions:
        logging.error(
            f"No conditions found in DB for Ann: {announcement.id}. Aborting mapping."
        )
        return None  # Cannot map without conditions
    if not blocks:
        logging.error(
            f"No blocks found in DB for announcement: {announcement.id}. Aborting mapping."
        )
        return None  # Cannot map without blocks

    all_links_in = []
    page_number = None
    doc = None
    processed_pages = 0
    failed_page_count = 0

    try:
        pdf_path = settings.MYHOME_DATA_DIR / announcement.filename
        doc = fitz.open(pdf_path)
    except FileNotFoundError:
        logging.error(f"File not found for mapping: {pdf_path}")
        return None
    except Exception as e:
        logging.error(f"Error opening PDF {pdf_path} for mapping: {e}")
        return None

    total_pages = len(doc)

    try:
        for page in doc:
            page_number = page.number + 1
            page_status = PageMappingStatus.ERROR  # Default to error
            error_message = None
            raw_response_dict = None
            page_links = []

            current_page_blocks = [b for b in blocks if b.page == page_number]
            current_page_conditions = [c for c in conditions if page_number in c.pages]

            if not current_page_conditions:
                logging.info(
                    f"No conditions relevant to page {page_number}. Skipping analysis."
                )
                # Optionally create a 'SKIPPED' status record or just continue
                processed_pages += 1
                continue

            if not current_page_blocks:
                logging.warning(
                    f"Conditions found for page {page_number}, but no blocks were extracted. Cannot perform mapping."
                )
                error_message = "Conditions present but no blocks found for this page."
                failed_page_count += 1
                # Proceed to save error status below
            else:
                # Only call LLM if we have blocks and conditions
                try:
                    page_links, raw_response, error = perform_reference_mapping_page(
                        announcement_id=announcement.id,
                        page=page,
                        page_blocks=current_page_blocks,
                        page_conditions=current_page_conditions,
                        model=model,
                    )

                    if error:
                        page_status = PageMappingStatus.ERROR
                        error_message = f"{type(error).__name__}: {str(error)}"
                        failed_page_count += 1
                    else:
                        page_status = PageMappingStatus.SUCCESS
                        all_links_in.extend(page_links)
                        processed_pages += 1

                    # Attempt to serialize raw response regardless of success/error
                    if raw_response:
                        raw_response_dict = raw_response.model_dump(mode="json")

                except Exception as page_exec_err:
                    # Catch unexpected errors *calling* perform_reference_mapping_page itself
                    logging.error(
                        f"Unexpected execution error processing page {page_number}: {page_exec_err}",
                        exc_info=True,
                    )
                    page_status = PageMappingStatus.ERROR
                    error_message = f"Unexpected execution error: {str(page_exec_err)}"
                    failed_page_count += 1

            # Prepare and save the page mapping result record
            page_mapping_result_in = PageMappingResultCreate(
                announcement_id=announcement.id,
                page_number=page_number,
                status=page_status,
                raw_response=raw_response_dict,
                error_message=error_message,
            )

            await crud_page_mapping_result.create(
                db_engine, obj_in=page_mapping_result_in
            )

        # --- Processing finished --- links saving
        links_created = []
        if all_links_in:
            try:
                # Create ReferenceLink objects in bulk
                links_created = await crud_reference_link.create_many(
                    db_engine, all_links_in
                )
                logging.info(
                    f"Saved {len(links_created)} reference links for announcement: {announcement.id}."
                )
            except Exception as db_err:
                logging.error(
                    f"Failed to save reference links to database for announcement {announcement.id}: {db_err}",
                    exc_info=True,
                )
                # Links might be partially created or not at all.
                # PageMappingResult records might point to non-existent links if this fails.

        # Final summary log
        log_level = logging.WARNING if failed_page_count > 0 else logging.INFO
        logging.log(
            log_level,
            f"Reference mapping finished for Ann: {announcement.id}. "
            f"Total pages: {total_pages}. Processed successfully: {processed_pages}. Failed: {failed_page_count}. "
            f"Total links generated: {len(all_links_in)}. Links saved: {len(links_created)}.",
        )

        return links_created  # Return list of saved ReferenceLink objects

    except Exception as e:
        context = (
            f"processing page {page_number}"
            if page_number is not None
            else "during mapping document setup"
        )
        error_msg = f"Unexpected error {context}: {e}"
        logging.error(f"{error_msg} (File: {pdf_path})", exc_info=True)
        return None  # Return None on major unexpected error during loop setup/execution
    finally:
        if doc:
            doc.close()
