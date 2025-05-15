import logging
from pathlib import Path

from google.genai import types

from app.core.gemini_client import gemini_client
from app.llm_providers.base_provider import LLMProviderStrategy


class GeminiProvider(LLMProviderStrategy):
    """
    LLMProviderStrategy implementation for Google Gemini models.
    """

    def generate_from_pdf(
        self,
        pdf_path: Path,
        system_prompt: str,
        user_prompt: str,
        model_name: str,  # This is the actual_model_name, e.g., "gemini-1.5-pro-latest"
    ) -> tuple[str, dict] | None:
        """
        Generates content from a PDF using Gemini API.

        Args:
            pdf_path: Path to the PDF file.
            system_prompt: The system prompt for Gemini.
            user_prompt: The user prompt for Gemini.
            model_name: The specific Gemini model name (e.g., "gemini-1.5-pro-latest").

        Returns:
            A tuple (content_text, raw_response_dict) or (None, error_dict).
        """
        try:
            response = gemini_client.models.generate_content(
                model=model_name,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0,
                ),
                contents=[
                    types.Part.from_bytes(
                        data=pdf_path.read_bytes(),
                        mime_type="application/pdf",
                    ),
                    user_prompt,
                ],
            )
        except Exception as e:
            logging.error(
                f"Failed during Gemini API call for {pdf_path}: {e}", exc_info=True
            )
            return None

        content = response.text
        return content, response.to_json_dict()
