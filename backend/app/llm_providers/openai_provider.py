import logging
from pathlib import Path

from openai.types.responses import Response

from app.core.openai_client import openai_client
from app.llm_providers.base_provider import LLMProviderStrategy
from app.pdf_analysis.utils import pdf_to_base64_image_strings


class OpenAIProvider(LLMProviderStrategy):
    """
    LLMProviderStrategy implementation for OpenAI models (e.g., GPT-4o).
    Handles PDF to image conversion for multimodal inputs.
    """

    def generate_from_pdf(
        self,
        pdf_path: Path,
        system_prompt: str,
        user_prompt: str,
        model_name: str,  # This is the actual_model_name, e.g., "gpt-4o"
    ) -> tuple[str, dict] | None:
        """
        Generates content from a PDF using OpenAI API.
        Converts PDF to images for multimodal input if required by the model.

        Args:
            pdf_path: Path to the PDF file.
            system_prompt: The system prompt for OpenAI.
            user_prompt: The user prompt for OpenAI.
            model_name: The specific OpenAI model name (e.g., "gpt-4o").

        Returns:
            A tuple (content_text, raw_response_dict) or (None, error_dict).
        """
        try:
            img_base64_list = pdf_to_base64_image_strings(pdf_path)
        except Exception as e:
            logging.error(f"Failed to convert PDF to images: {pdf_path} - {e}")
            return None

        contents = []
        for i, img_base64 in enumerate(img_base64_list):
            page_num = i + 1
            contents.append({"type": "input_text", "text": f"page_number: {page_num}"})
            contents.append(
                {
                    "type": "input_image",
                    "image_url": f"data:image/jpeg;base64,{img_base64}",
                }
            )

        try:
            response: Response = openai_client.responses.create(
                model=model_name,
                temperature=0.0,
                top_p=1,
                input=[
                    {"role": "developer", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                    {"role": "user", "content": contents},
                ],
            )
            raw_response_dict = response.model_dump()
        except Exception as e:
            logging.error(
                f"Failed during OpenAI API call for {pdf_path}: {e}",
                exc_info=True,
            )
            return None

        content = response.output_text
        return content, raw_response_dict
