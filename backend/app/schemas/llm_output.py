from typing import Any

from pydantic import BaseModel, model_validator

from app.enums import AnnouncementType
from app.pdf_analysis.schemas import PublicLeaseCategory, PublicLeaseOutput


class LLMOutputCreate(BaseModel):
    announcement_type: AnnouncementType
    announcement_id: str
    model: str
    system_prompt: str
    user_prompt: str
    content: PublicLeaseOutput
    raw_response: dict

    @model_validator(mode="after")
    def check_content_type(cls, data: Any) -> Any:
        # Check if data is already a model instance (which it should be in 'after' mode)
        if not isinstance(data, LLMOutputCreate):
            return data

        content = data.content
        announcement_type = data.announcement_type

        if announcement_type == AnnouncementType.PUBLIC_LEASE:
            if not isinstance(content, list):
                for item in content:
                    if not isinstance(item, PublicLeaseCategory):
                        raise ValueError(
                            "Content must be a list of PublicLeaseCategory for public_lease type"
                        )
        return data


class LLMOutputUpdate(BaseModel):
    pass
