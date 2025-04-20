from app.pdf_analysis.prompts import PUBLIC_SALE_SYSTEM_PROMPT, PUBLIC_SALE_USER_PROMPT
from app.pdf_analysis.schemas import AnalysisResult
from app.pdf_analysis.strategies.base import PDFAnalysisStrategy


class PublicSaleAnalysisStrategy(PDFAnalysisStrategy):
    @property
    def system_prompt(self) -> str:
        return PUBLIC_SALE_SYSTEM_PROMPT

    @property
    def user_prompt(self) -> str:
        return PUBLIC_SALE_USER_PROMPT

    def analyze(self, pdf_path: str, model: str = "gpt-4.1-mini") -> AnalysisResult:
        raise NotImplementedError("Public sale analysis is not implemented yet.")
