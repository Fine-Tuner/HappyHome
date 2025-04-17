from abc import ABC, abstractmethod
from typing import Any


class PDFAnalysisStrategy(ABC):
    """
    Abstract base class for different PDF analysis strategies.
    """

    @abstractmethod
    def analyze(self, pdf_input: Any, model: str) -> str:
        """
        Performs the analysis based on the specific strategy.

        Args:
            pdf_input: The input derived from the PDF (e.g., file path, image bytes list).
                       The exact type depends on the strategy implementation.
            model: The OpenAI model to use for analysis.

        Returns:
            The analysis result as a string (e.g., JSON string).
        """
        pass

    @abstractmethod
    def parse_response(self, response: str) -> Any:
        """
        Parses the response from the analysis.
        """
        pass
