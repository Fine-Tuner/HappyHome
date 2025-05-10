import logging
from collections import defaultdict

from google.genai import types
from pydantic import ValidationError

from app.core.config import settings
from app.core.gemini_client import gemini_client
from app.models.announcement import Announcement
from app.pdf_analysis.llm_content_parsers import parse_and_validate_llm_response
from app.pdf_analysis.prompts import (
    PUBLIC_LEASE_DEVELOPER_PROMPT,
    PUBLIC_LEASE_USER_PROMPT,
)
from app.pdf_analysis.schemas import PublicLeaseCategory, PublicLeaseOutput
from app.pdf_analysis.strategies.base import PDFInformationExtractionStrategy


def _prepare_category_condition_map(
    validated_data: PublicLeaseOutput,
) -> dict[str, list[dict]]:
    """Flattens hierarchical data and prepares Condition model instances."""
    d = defaultdict(list)
    for category in validated_data:
        category_name = category.category
        conditions = category.conditions
        for condition in conditions:
            d[category_name].append(
                {
                    "content": condition.content,
                    "section": condition.section,
                    "page": condition.page,
                    "bbox": condition.bbox,
                }
            )
    return d


class PublicLeaseInformationExtractionStrategy(PDFInformationExtractionStrategy):
    """
    Analysis strategy for public lease announcements using image-based analysis
    and the responses API with centralized retry/validation logic.
    Stores LLMOutput raw response and flattened Condition objects separately.
    """

    @property
    def system_prompt(self) -> str:
        return PUBLIC_LEASE_DEVELOPER_PROMPT

    @property
    def user_prompt(self) -> str:
        return PUBLIC_LEASE_USER_PROMPT

    def analyze(
        self,
        announcement: Announcement,
        model: str = "gemini-2.5-pro-preview-05-06",
        max_retries: int = 3,
    ) -> tuple[dict, dict[str, list[dict]]] | None:
        """
        Analyzes a public lease announcement PDF.

        Stores the raw LLM response in LLMOutput and saves flattened
        Condition objects separately.

        Args:
            announcement: The announcement object containing file path and ID.
            model: The OpenAI model to use.
            max_retries: Maximum number of retries for parsing and validation.

        Returns:
            A tuple containing the created LLMOutput object and the list
            of created Condition objects on success, None on failure.
        """
        pdf_path = settings.MYHOME_DATA_DIR / announcement.filename
        response = gemini_client.models.generate_content(
            model=model,
            config=types.GenerateContentConfig(
                system_instruction=self.system_prompt,
                temperature=0,
            ),
            contents=[
                types.Part.from_bytes(
                    data=pdf_path.read_bytes(),
                    mime_type="application/pdf",
                ),
                self.user_prompt,
            ],
        )

        llm_output = {
            "model": model,
            "raw_response": response.to_json_dict(),
        }

        content = response.text
        if not content:
            raise RuntimeError(
                f"LLM returned no content for {pdf_path} (LLMOutput ID: {llm_output.id})"
            )

        try:
            validated_data: PublicLeaseOutput = parse_and_validate_llm_response(
                content=content,
                validation_model=list[PublicLeaseCategory],
                model=model,
                max_retries=max_retries,
            )

            category_condition_map = _prepare_category_condition_map(
                validated_data=validated_data,
            )

            return llm_output, category_condition_map

        except (RuntimeError, TypeError, ValidationError) as e:
            logging.error(
                f"Failed to validate/process LLM response for {pdf_path} : {e}",
                exc_info=True,
            )
            return llm_output, None
        except Exception as e:
            logging.error(
                f"Unexpected error during condition processing/saving for {pdf_path} : {e}",
                exc_info=True,
            )
            return llm_output, None
