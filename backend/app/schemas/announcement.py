from datetime import datetime
from typing import Any

from pydantic import BaseModel, field_validator

from app.enums import AnnouncementType
from app.models.announcement import Announcement
from app.models.announcement_view import AnnouncementView


def empty_str_to_none(value: Any) -> Any | None:
    """Converts empty strings to None."""
    if value == "":
        return None
    return value


class AnnouncementCreate(BaseModel):
    pblancId: str
    houseSn: int
    sttusNm: str
    pblancNm: str
    suplyInsttNm: str
    houseTyNm: str
    suplyTyNm: str
    suplyInsttNm: str
    houseTyNm: str
    suplyTyNm: str
    beforePblancId: str
    rcritPblancDe: str
    przwnerPresnatnDe: str
    suplyHoCo: str
    refrnc: str
    url: str
    pcUrl: str | None = None
    mobileUrl: str
    hsmpNm: str
    brtcNm: str
    signguNm: str
    fullAdres: str
    rnCodeNm: str
    refrnLegaldongNm: str
    pnu: str
    heatMthdNm: str
    totHshldCo: int | None = None
    sumSuplyCo: int | None = None
    rentGtn: int | None = None
    enty: int | None = None
    prtpay: int | None = None
    surlus: int | None = None
    mtRntchrg: int | None = None
    beginDe: str
    endDe: str
    filename: str | None = None
    type: AnnouncementType

    @field_validator(
        "totHshldCo",
        "sumSuplyCo",
        "rentGtn",
        "enty",
        "prtpay",
        "surlus",
        "mtRntchrg",
        mode="before",
    )
    @classmethod
    def validate_optional_int(cls, value: Any) -> Any | None:
        return empty_str_to_none(value)


class AnnouncementUpdate(BaseModel):
    pass


class AnnouncementRead(BaseModel):
    sn: int  # pblancId
    address: str = "address"
    suplyType: str  # suplyTyNm
    houseType: str  # houseTyNm
    targetGroup: str = "targetGroup"
    area: list[float]  # area
    totalHouseholds: int | None  # totHshldCo
    announcementDate: datetime  # rcritPblancDe
    announcementName: str  # pblancNm
    applicationStartDate: datetime  # beginDe
    applicationEndDate: datetime  # endDe
    moveInDate: str = "moveInDate"
    viewCount: int  # DB에서 따로 관리해야 하는 값

    @classmethod
    def from_model(
        cls, announcement: Announcement, announcement_view: AnnouncementView
    ) -> "AnnouncementRead":
        return cls(
            sn=announcement.id,
            address=announcement.full_address,
            suplyType=announcement.house_type_name,
            houseType=announcement.house_type_name,
            area=[100.0, 100.0],
            totalHouseholds=announcement.total_household_count,
            announcementDate=announcement.application_date,
            announcementName=announcement.announcement_name,
            applicationStartDate=announcement.begin_date,
            applicationEndDate=announcement.end_date,
            viewCount=announcement_view.view_count,
        )


class AnnouncementListResponse(BaseModel):
    items: list[AnnouncementRead]
    totalCount: int


class AnnouncementDetailResponse(BaseModel):
    pass
