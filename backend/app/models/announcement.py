from datetime import datetime, timezone
from uuid import uuid4

from odmantic import Field, Model

from app.enums import AnnouncementType


class Announcement(Model):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_field=True)
    announcement_id: int = Field(index=True, unique=True)
    raw_data: dict
    announcement_name: str  # pblancNm
    housing_name: str  # hsmpNm
    supply_institution_name: str  # suplyInsttNm
    full_address: str  # fullAdres
    total_supply_count: int  # sumSuplyCo
    rent_guarantee: int  # rentGtn
    monthly_rent: int  # mtRntchrg
    pdf_url: str  # pcUrl
    begin_date: datetime | None  # beginDe
    end_date: datetime | None  # endDe
    filename: str | None = None
    type: AnnouncementType
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
