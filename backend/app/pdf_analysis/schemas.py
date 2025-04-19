from typing import Literal

from openai.types.chat import ChatCompletion
from pydantic import BaseModel


class AnalysisResult(BaseModel):
    """
    Generic output wrapper for PDF analysis strategies.
    """

    status: Literal["success", "failure"]
    response: ChatCompletion | None = None
    error_message: str | None = None
