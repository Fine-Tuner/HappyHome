from typing import Any

from app.pdf_analysis.information_extractor import (
    extract_information as default_extract_pdf,
)
from app.pdf_analysis.strategies.base import PDFInformationExtractionStrategy
from app.schemas.llm_output import LLMOutputCreate


async def perform_information_extraction(
    announcement_id: str,
    model: str,
    db_engine: Any,
    analysis_strategy: PDFInformationExtractionStrategy,
    crud_announcement: Any,
    crud_llm_output: Any,
    extract_pdf_func: callable = default_extract_pdf,
) -> None:
    ann = await crud_announcement.get(db_engine, {"_id": announcement_id})
    if ann is None:
        print(f"Announcement with id {announcement_id} not found for model {model}")
        return

    print(f"Extracting information from announcement {ann.id} with model: {model}")

    result = extract_pdf_func(ann.file_path, analysis_strategy, model=model)

    if result is None:
        print(f"Failed to extract information from announcement {ann.id}")
        return

    response, content = result
    return await crud_llm_output.create(
        db_engine,
        LLMOutputCreate(
            announcement_type=ann.type,
            announcement_id=ann.id,
            model=response.model,
            system_prompt=analysis_strategy.system_prompt,
            user_prompt=analysis_strategy.user_prompt,
            content=content,
            raw_response=response.model_dump(),
        ),
    )
