from collections.abc import Callable
from typing import Any

import pytest

from app.crud import crud_announcement, crud_llm_output
from app.enums import AnnouncementType
from app.pdf_analysis.llm_content_parsers import parse_openai_content_as_json
from app.pdf_analysis.strategies.base import PDFInformationExtractionStrategy
from app.schemas.announcement import AnnouncementCreate
from app.services.information_extraction_service import (
    InformationExtractionResult,
    perform_information_extraction,
)


def create_dummy_analyze_pdf(fixed_output: InformationExtractionResult) -> Callable:
    """Creates a dummy analyze_pdf function that returns a predefined success output."""

    # Define the dummy function inside the factory
    def dummy_analyze_pdf(
        file_path: str,
        strategy: PDFInformationExtractionStrategy,
        model: str,
        **kwargs: Any,  # Accept any other potential kwargs
    ) -> InformationExtractionResult:
        """Ignores inputs and returns the fixed success output."""
        return fixed_output

    return dummy_analyze_pdf


class StubStrategy(PDFInformationExtractionStrategy):
    """A minimal strategy implementation for testing."""

    @property
    def system_prompt(self) -> str:
        return "Default Stub Prompt"

    @property
    def user_prompt(self) -> str:
        return "Default Stub Prompt"

    def analyze(
        self, pdf_path: str, model: str = "gpt-4.1-mini"
    ) -> InformationExtractionResult:
        pass


@pytest.mark.asyncio
async def test_perform_analysis_logic_success_with_dummy_func(
    engine, openai_chat_completion, housing_list, announcement_path
):
    """Tests the success path where analysis succeeds and data is saved."""
    stub_strategy = StubStrategy()
    ann_in = AnnouncementCreate(**housing_list[0], file_path=str(announcement_path))

    created_ann = await crud_announcement.create(engine, obj_in=ann_in)
    ann_id_to_use = created_ann.id

    analysis_result = InformationExtractionResult(
        announcement_type=AnnouncementType.PUBLIC_LEASE,
        status="success",
        response=openai_chat_completion,
        error_message=None,
    )

    dummy_analyze_func = create_dummy_analyze_pdf(analysis_result)

    created_analysis = await perform_information_extraction(
        announcement_id=ann_id_to_use,
        model=openai_chat_completion.model,
        db_engine=engine,
        strategy=stub_strategy,
        crud_announcement=crud_announcement,
        crud_llm_output=crud_llm_output,
        extract_pdf_func=dummy_analyze_func,
    )

    assert created_analysis is not None
    assert created_analysis.announcement_id == ann_id_to_use
    assert created_analysis.model == openai_chat_completion.model
    assert created_analysis.system_prompt == stub_strategy.system_prompt
    assert created_analysis.user_prompt == stub_strategy.user_prompt

    expected_content = parse_openai_content_as_json(
        openai_chat_completion.choices[0].message.content
    )
    assert created_analysis.content == expected_content
    assert created_analysis.raw_response == openai_chat_completion.model_dump()
