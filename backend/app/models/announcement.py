from datetime import datetime, timezone

from odmantic import Field, Model

from app.enums import AnnouncementType


class Announcement(Model):
    id: str = Field(index=True, unique=True, primary_field=True)  # pblancId
    raw_data: dict
    house_serial_number: int  # houseSn
    status_name: str  # sttusNm
    announcement_name: str  # pblancNm
    supply_institution_name: str  # suplyInsttNm
    house_type_name: str  # houseTyNm
    supply_type_name: str  # suplyTyNm
    application_date: str  # rcritPblancDe
    winners_presentation_date: str  # przwnerPresnatnDe
    url: str  # url
    housing_block_name: str  # hsmpNm
    province_name: str  # brtcNm
    district_name: str  # signguNm
    full_address: str  # fullAdres
    road_name: str  # rnCodeNm
    heating_method_name: str  # heatMthdNm
    total_household_count: int | None  # totHshldCo
    total_supply_count: int  # sumSuplyCo
    rent_guarantee: int  # rentGtn
    monthly_rent_charge: int  # mtRntchrg
    begin_date: datetime | None  # beginDe
    end_date: datetime | None  # endDe
    filename: str | None = None
    type: AnnouncementType
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
