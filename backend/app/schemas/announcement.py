from typing import Any

from pydantic import BaseModel, field_validator

from app.enums import AnnouncementType


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
