from abc import ABC, abstractmethod
from pathlib import Path


class LLMProviderStrategy(ABC):
    """
    Abstract Base Class for LLM provider strategies.
    Defines a common interface for generating content from a PDF.
    """

    @abstractmethod
    def generate_from_pdf(
        self,
        pdf_path: Path,
        system_prompt: str,
        user_prompt: str,
        model_name: str,
    ) -> tuple[str, dict] | None:
        """
        Generates content from a PDF file using the specific LLM provider.

        Args:
            pdf_path: Path to the PDF file.
            system_prompt: The system prompt for the LLM.
            user_prompt: The user prompt for the LLM.
            model_name: The specific model name for the provider.

        Returns:
            A tuple containing:
                - The extracted text content (str) or None if an error occurs.
                - The raw API response dictionary (dict) or None if an error occurs.
        """
        pass
