import fitz
from PIL import Image

from app.core.openai_client import openai_client
from app.models.announcement import Announcement
from app.models.layout import Layout
from app.models.llm_output import LLMOutput
from app.pdf_analysis.prompts import (
    REFERENCE_MAPPING_SYSTEM_PROMPT,
    REFERENCE_MAPPING_USER_PROMPT,
)
from app.pdf_analysis.utils import pil_image_to_base64, pixmap_to_image
from app.schemas.layout import Block, BlockType


def perform_reference_mapping_page(
    page: fitz.Page,
    page_blocks: list[Block],
    page_conditions: list[dict],
    image: Image.Image,
    width: int,
    height: int,
):
    contents = []
    contents.append(
        {
            "type": "text",
            "text": "<볼록 목록 삽입>",
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
            contents.append({"type": "text", "text": f"block_index: {i}"})
            contents.append(
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{cropped_image_base64}"
                    },
                }
            )
            block_contents.append(cropped_image)
        else:
            rect = fitz.Rect(bbox)
            text = page.get_textbox(rect)
            contents.append({"type": "text", "text": f"block_index: {i}"})
            contents.append({"type": "text", "text": text})
            block_contents.append(text)

    contents.append(
        {
            "type": "text",
            "text": "<조건 삽입>",
        }
    )
    for j, condition in enumerate(page_conditions):
        contents.append({"type": "text", "text": f"condition_index: {j}"})
        contents.append({"type": "text", "text": f"{condition['content']}"})

    # TODO: handle failure cases - re-run N times
    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": REFERENCE_MAPPING_SYSTEM_PROMPT},
            {"role": "user", "content": REFERENCE_MAPPING_USER_PROMPT},
            {"role": "user", "content": contents},
        ],
    )
    return response.choices[0].message.content


def perform_reference_mapping_doc(
    announcement: Announcement,
    layout: Layout,
    llm_output: LLMOutput,
):
    width = layout.width
    height = layout.height
    blocks = layout.blocks
    conditions = []
    for category in llm_output.content:
        for item in category["items"]:
            for condition in item["conditions"]:
                conditions.append(condition)

    doc = fitz.open(announcement.file_path)
    for page in doc:
        page_number = page.number + 1
        page_blocks = [block for block in blocks if block.page == page_number]

        image = pixmap_to_image(page.get_pixmap())

        page_conditions = []
        for condition in conditions:
            if page_number in condition["pages"]:
                page_conditions.append(condition)

        perform_reference_mapping_page(
            page, page_blocks, page_conditions, width, height, image
        )
