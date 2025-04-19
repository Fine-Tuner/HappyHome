from abc import ABC, abstractmethod

from app.pdf_analysis.schemas import AnalysisResult


class PDFAnalysisStrategy(ABC):
    @property
    @abstractmethod
    def prompt(self) -> str:
        pass

    @abstractmethod
    def analyze(self, pdf_path: str, model: str = "gpt-4.1-mini") -> AnalysisResult:
        pass
