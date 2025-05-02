from abc import ABC, abstractmethod
from typing import Any


class PDFInformationExtractionStrategy(ABC):
    @property
    @abstractmethod
    def user_prompt(self) -> str:
        pass

    @property
    @abstractmethod
    def system_prompt(self) -> str:
        pass

    @abstractmethod
    def analyze(self, pdf_path: str, model: str = "gpt-4.1-mini") -> Any | None:
        pass
