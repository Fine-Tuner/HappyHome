from app.pdf_analysis.strategy import PDFAnalysisStrategy


def analyze_pdf(
    pdf_path: str, strategy: PDFAnalysisStrategy, model: str = "gpt-4.1-mini"
) -> str:
    """
    Analyzes a PDF using a specified strategy.

    Args:
        pdf_path: Path to the PDF file.
        strategy: The analysis strategy instance to use.
        model: The OpenAI model to use for analysis (passed to the strategy).

    Returns:
        The analysis result string from the strategy.
    """
    return strategy.analyze(pdf_path=pdf_path, model=model)
