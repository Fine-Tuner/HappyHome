import logging
from collections import defaultdict

from pydantic import ValidationError

from app.core.config import settings
from app.llm_providers.factory import get_llm_provider
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
        model_identifier: str = "gemini/gemini-2.5-pro-preview-05-06",
        max_retries: int = 3,
    ) -> tuple[dict, dict[str, list[dict]]] | None:
        """
        Analyzes a public lease announcement PDF using the specified model provider strategy.

        Stores the raw LLM response and saves flattened Condition objects separately.

        Args:
            announcement: The announcement object containing file path and ID.
            model_identifier: Identifier for the model and provider (e.g., "gemini/model-name", "openai/model-name").
            max_retries: Maximum number of retries for parsing and validation.

        Returns:
            A tuple containing the LLM output metadata and the category_condition_map on success,
            or (llm_output_metadata, None) on failure during processing/validation,
            or (None, None) if the PDF file itself is not found.
        Raises:
            ValueError: If the model_identifier is invalid or provider is unsupported by the factory.
        """
        pdf_path = settings.MYHOME_DATA_DIR / announcement.filename
        if not pdf_path.exists():
            logging.error(f"PDF file not found: {pdf_path}")
            # Return None, None if the PDF is not found, as no LLM call will be made.
            return None, None

        try:
            provider_name, actual_model_name = model_identifier.split("/", 1)
        except ValueError:
            # Log the error and raise it, as it's an invalid input format.
            logging.error(
                f"Invalid model_identifier: '{model_identifier}'. Expected format 'provider/model_name'."
            )
            raise ValueError(
                f"Invalid model_identifier: '{model_identifier}'. Expected format 'provider/model_name'."
            )

        llm_provider = get_llm_provider(provider_name)
        content, raw_response_dict = llm_provider.generate_from_pdf(
            pdf_path=pdf_path,
            system_prompt=self.system_prompt,
            user_prompt=self.user_prompt,
            model_name=actual_model_name,
        )
        llm_output_meta = {
            "model": model_identifier,
            "raw_response": raw_response_dict,
        }

        if content is None:
            logging.error(
                f"LLM provider '{provider_name}' returned no content for {pdf_path} (model: {model_identifier}). "
                f"Raw response from provider: {raw_response_dict}"
            )
            return llm_output_meta, None

        try:
            validated_data: PublicLeaseOutput = parse_and_validate_llm_response(
                content=content,
                validation_model=list[PublicLeaseCategory],
            )
            category_condition_map = _prepare_category_condition_map(
                validated_data=validated_data,
            )
            return llm_output_meta, category_condition_map

        except (RuntimeError, TypeError, ValidationError) as e:
            logging.error(
                f"Failed to validate/process LLM response for {pdf_path} (model: {model_identifier}): {e}",
                exc_info=True,
            )
            return llm_output_meta, None
        except Exception as e:
            logging.error(
                f"Unexpected error during condition processing/saving for {pdf_path} (model: {model_identifier}): {e}",
                exc_info=True,
            )
            return llm_output_meta, None
