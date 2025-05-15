from typing import Any

from app.models.announcement import Announcement
from app.pdf_analysis.strategies.base import PDFInformationExtractionStrategy


def extract_information(
    announcement: Announcement,
    strategy: PDFInformationExtractionStrategy,
    model_identifier: str = "gemini/gemini-2.5-pro-preview-05-06",
) -> Any:
    """
    Analyzes a PDF using a specified strategy.

    Args:
        pdf_path: Path to the PDF file.
        strategy: The analysis strategy instance to use.
        model: The OpenAI model to use for analysis (passed to the strategy).

    Returns:
        An AnalysisOutput object containing the status and result/error.
    """
    return strategy.analyze(
        announcement=announcement, model_identifier=model_identifier
    )
