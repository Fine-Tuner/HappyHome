from typing import Any

from app.pdf_analysis.strategies.base import PDFInformationExtractionStrategy


def extract_information(
    pdf_path: str,
    strategy: PDFInformationExtractionStrategy,
    model: str = "gpt-4.1-mini",
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
    return strategy.analyze(pdf_path=pdf_path, model=model)
