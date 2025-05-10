from typing import Any

from app.crud import (
    crud_announcement,
    crud_category,
    crud_condition,
    crud_llm_analysis_result,
)
from app.models.announcement import Announcement
from app.pdf_analysis.information_extractor import (
    extract_information as default_extract_pdf,
)
from app.pdf_analysis.strategies.base import PDFInformationExtractionStrategy
from app.schemas.category import CategoryCreate
from app.schemas.condition import ConditionCreate
from app.schemas.llm_analysis_result import LLMAnalysisResultCreate


async def perform_information_extraction(
    announcement_id: str,
    model: str,
    db_engine: Any,
    strategy: PDFInformationExtractionStrategy,
    crud_announcement: Any = crud_announcement,
    crud_llm_analysis_result: Any = crud_llm_analysis_result,
    crud_condition: Any = crud_condition,
    extract_pdf_func: callable = default_extract_pdf,
) -> None:
    ann = await crud_announcement.get(db_engine, Announcement.id == announcement_id)
    if ann is None:
        print(f"Announcement with id {announcement_id} not found for model {model}")
        return

    print(f"Extracting information from announcement {ann.id} with model: {model}")

    result = extract_pdf_func(ann, strategy, model=model)

    if result is None:
        print(f"Failed to extract information from announcement {ann.id}")
        return

    llm_output, category_condition_map = result
    llm_output_created = await crud_llm_analysis_result.create(
        db_engine,
        LLMAnalysisResultCreate(
            announcement_type=ann.type,
            announcement_id=ann.id,
            model=llm_output["model"],
            raw_response=llm_output["raw_response"],
        ),
    )
    categories_created = []
    conditions_created = []
    for category_name, conditions_data in category_condition_map.items():
        category_created = await crud_category.create(
            db_engine,
            CategoryCreate(
                announcement_id=ann.id,
                name=category_name,
            ),
        )
        categories_created.append(category_created)

        for condition_data in conditions_data:
            condition_in = ConditionCreate(
                announcement_id=ann.id,
                llm_output_id=llm_output_created.id,
                category_id=category_created.id,
                content=condition_data["content"],
                section=condition_data["section"],
                page=condition_data["page"],
                bbox=condition_data["bbox"],
            )
            conditions_created.append(
                await crud_condition.create(db_engine, condition_in)
            )

    return llm_output_created, categories_created, conditions_created
