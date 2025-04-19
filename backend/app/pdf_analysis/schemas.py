from typing import Literal

from openai.types.chat import ChatCompletion
from pydantic import BaseModel

from app.enums import AnnouncementType


class AnalysisResult(BaseModel):
    """
    Generic output wrapper for PDF analysis strategies.
    """

    status: Literal["success", "failure"]
    announcement_type: AnnouncementType | None = None
    response: ChatCompletion | None = None
    error_message: str | None = None
