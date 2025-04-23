import logging

from openai.types.responses import Response
from pydantic import ValidationError

from app.core.openai_client import openai_client
from app.pdf_analysis.llm_content_parsers import parse_and_validate_openai_response
from app.pdf_analysis.prompts import (
    PUBLIC_LEASE_DEVELOPER_PROMPT,
    PUBLIC_LEASE_USER_PROMPT,
)
from app.pdf_analysis.schemas import PublicLeaseCategory, PublicLeaseOutput
from app.pdf_analysis.strategies.base import PDFInformationExtractionStrategy
from app.pdf_analysis.utils import pdf_to_base64_image_strings


class PublicLeaseInformationExtractionStrategy(PDFInformationExtractionStrategy):
    """
    Analysis strategy for public lease announcements using image-based analysis
    and the responses API with centralized retry/validation logic.
    """

    @property
    def system_prompt(self) -> str:
        return PUBLIC_LEASE_DEVELOPER_PROMPT

    @property
    def user_prompt(self) -> str:
        return PUBLIC_LEASE_USER_PROMPT

    def analyze(
        self,
        pdf_path: str,
        model: str = "gpt-4.1-mini",
        max_retries: int = 3,
    ) -> tuple[Response, PublicLeaseOutput] | None:
        """
        Analyzes a public lease announcement PDF using the responses API
        with retry logic and schema validation.

        Args:
            pdf_path: Path to the PDF file.
            model: The OpenAI model to use.
            max_retries: Maximum number of retries for parsing and validation.

        Returns:
            A tuple containing the initial Response object and the validated
            PublicLeaseOutput (list of categories) on success, None on failure.
        """
        try:
            img_base64_list = pdf_to_base64_image_strings(pdf_path)
        except Exception as e:
            logging.error(f"Failed to convert PDF to images: {pdf_path} - {e}")
            return

        # Prepare image content for the responses API input format
        contents = []
        for i, img_base64 in enumerate(img_base64_list):
            page_num = i + 1
            # Use the 'input_text' and 'input_image' structure
            contents.append({"type": "input_text", "text": f"page_number: {page_num}"})
            contents.append(
                {
                    "type": "input_image",
                    "image_url": f"data:image/jpeg;base64,{img_base64}",
                }
            )

        # Use responses.create instead of chat.completions.create
        response: Response = openai_client.responses.create(
            model=model,
            input=[
                {"role": "developer", "content": self.system_prompt},
                {"role": "user", "content": self.user_prompt},
                {"role": "user", "content": contents},
            ],
        )

        # Use the centralized parser/validator
        try:
            # Pass List[PublicLeaseCategory] as the validation_model
            validated_data: PublicLeaseOutput = parse_and_validate_openai_response(
                response=response,
                validation_model=list[PublicLeaseCategory],
                model=model,
                max_retries=max_retries,
            )
            # Return the initial response and the validated list
            return response, validated_data

        except (RuntimeError, TypeError, ValidationError) as e:
            # Log the final error from the parser/validator function or type error
            logging.error(
                f"Failed to get and validate public lease response for {pdf_path} after retries: {e}",
                exc_info=True,
            )
            return None
        except Exception as e:
            # Catch any other unexpected errors during the process
            logging.error(
                f"Unexpected error during public lease analysis for {pdf_path}: {e}",
                exc_info=True,
            )
            return None
