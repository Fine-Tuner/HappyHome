from typing import Any

from app.pdf_analysis.prompts import (
    PUBLIC_SALE_DEVELOPER_PROMPT,
    PUBLIC_SALE_USER_PROMPT,
)
from app.pdf_analysis.strategies.base import PDFInformationExtractionStrategy


class PublicSaleInformationExtractionStrategy(PDFInformationExtractionStrategy):
    @property
    def system_prompt(self) -> str:
        return PUBLIC_SALE_DEVELOPER_PROMPT

    @property
    def user_prompt(self) -> str:
        return PUBLIC_SALE_USER_PROMPT

    def analyze(self, pdf_path: str, model: str = "gpt-4.1-mini") -> Any:
        raise NotImplementedError("Public sale analysis is not implemented yet.")
