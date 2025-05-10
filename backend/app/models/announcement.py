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
    application_date: datetime  # rcritPblancDe
    winners_presentation_date: datetime  # przwnerPresnatnDe
    url: str  # url
    housing_block_name: str | None  # hsmpNm
    province_name: str | None  # brtcNm
    district_name: str | None  # signguNm
    full_address: str | None  # fullAdres
    road_name: str | None  # rnCodeNm
    heating_method_name: str | None  # heatMthdNm
    total_household_count: int | None  # totHshldCo
    total_supply_count: int | None  # sumSuplyCo
    rent_guarantee: int | None  # rentGtn
    monthly_rent_charge: int | None  # mtRntchrg
    begin_date: datetime | None  # beginDe
    end_date: datetime | None  # endDe
    filename: str | None = None
    type: AnnouncementType
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
