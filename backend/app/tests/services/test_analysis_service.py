from collections.abc import Callable
from typing import Any

import pytest

from app.crud import announcement, announcement_analysis
from app.pdf_analysis.parsers import parse_openai_content_as_json
from app.pdf_analysis.strategies.base import PDFAnalysisStrategy
from app.schemas.announcement import AnnouncementCreate
from app.services.analysis_service import AnalysisResult, perform_analysis_logic


def create_dummy_analyze_pdf(fixed_output: AnalysisResult) -> Callable:
    """Creates a dummy analyze_pdf function that returns a predefined success output."""

    # Define the dummy function inside the factory
    def dummy_analyze_pdf(
        file_path: str,
        strategy: PDFAnalysisStrategy,
        model: str,
        **kwargs: Any,  # Accept any other potential kwargs
    ) -> AnalysisResult:
        """Ignores inputs and returns the fixed success output."""
        return fixed_output

    return dummy_analyze_pdf


class StubStrategy(PDFAnalysisStrategy):
    """A minimal strategy implementation for testing."""

    @property
    def prompt(self) -> str:
        return "Default Stub Prompt"

    def analyze(self, pdf_path: str, model: str = "gpt-4.1-mini") -> AnalysisResult:
        pass


@pytest.mark.asyncio
async def test_perform_analysis_logic_success_with_dummy_func(
    engine, openai_chat_completion, housing_list
):
    """Tests the success path where analysis succeeds and data is saved."""
    stub_strategy = StubStrategy()
    ann_in = AnnouncementCreate(**housing_list[0])

    created_ann = await announcement.create(engine, obj_in=ann_in)
    ann_id_to_use = created_ann.id

    analysis_result = AnalysisResult(
        status="success",
        response=openai_chat_completion,
        error_message=None,
    )

    dummy_analyze_func = create_dummy_analyze_pdf(analysis_result)

    created_analysis = await perform_analysis_logic(
        announcement_id=ann_id_to_use,
        model=openai_chat_completion.model,
        db_engine=engine,
        analysis_strategy=stub_strategy,
        crud_announcement=announcement,
        crud_analysis=announcement_analysis,
        analyze_pdf_func=dummy_analyze_func,
    )

    assert created_analysis is not None
    assert created_analysis.announcement_id == ann_id_to_use
    assert created_analysis.model == openai_chat_completion.model
    assert created_analysis.prompt == stub_strategy.prompt

    expected_content = parse_openai_content_as_json(
        openai_chat_completion.choices[0].message.content
    )
    assert created_analysis.content == expected_content
    assert created_analysis.raw_response == openai_chat_completion.model_dump()
