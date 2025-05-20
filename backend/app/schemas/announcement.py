from datetime import datetime, time, timezone
from typing import Any, Literal

from odmantic.query import QueryExpression
from pydantic import BaseModel, Field, field_validator

from app.enums import AnnouncementType
from app.models.announcement import Announcement
from app.schemas.category import CategoryResponse
from app.schemas.condition import ConditionResponse


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
    view_count: int
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class AnnouncementRead(BaseModel):
    id: str  # pblancId
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
    viewCount: int

    @classmethod
    def from_model(cls, announcement: Announcement) -> "AnnouncementRead":
        return cls(
            id=announcement.id,
            address=announcement.full_address,
            suplyType=announcement.supply_type_name,
            houseType=announcement.house_type_name,
            area=[100.0, 100.0],
            totalHouseholds=announcement.total_household_count,
            announcementDate=announcement.application_date,
            announcementName=announcement.announcement_name,
            applicationStartDate=announcement.begin_date,
            applicationEndDate=announcement.end_date,
            viewCount=announcement.view_count,  # Get view_count from announcement
        )


class AnnouncementListRequest(BaseModel):
    page: int
    limit: int
    provinceName: str | None = None
    districtName: str | None = None
    supplyTypeName: str | None = None
    houseTypeName: str | None = None
    beginDate: str | None = None
    endDate: str | None = None
    announcementName: str | None = None
    sortType: Literal["latest", "view", "deadline"] = "latest"
    announcementStatus: Literal["open", "receiving", "closed"] | None = None

    _filter_map = {
        "provinceName": ("province_name", "equal"),
        "districtName": ("district_name", "equal"),
        "supplyTypeName": ("supply_type_name", "equal"),
        "houseTypeName": ("house_type_name", "equal"),
        "announcementName": ("announcement_name", "contains"),
        "beginDate": ("begin_date", "gte_date"),
        "endDate": ("end_date", "lte_date"),
    }

    _sort_map = {
        "latest": "application_date",
        "deadline": "end_date",
        "view": "view_count",  # Added "view" to sort_map pointing to "view_count"
    }

    def get_query_conditions(
        self, model_cls: type[Announcement]
    ) -> list[QueryExpression]:
        query_conditions: list[QueryExpression] = []
        for req_field, (model_field_name, op_type) in self._filter_map.items():
            req_value = getattr(self, req_field, None)
            if req_value is not None:
                model_field = getattr(model_cls, model_field_name)
                if op_type == "equal":
                    query_conditions.append(model_field == req_value)
                elif op_type == "contains":
                    query_conditions.append(model_field.match(f"(?i).*{req_value}.*"))
                elif op_type == "gte_date":
                    date_obj = datetime.fromisoformat(req_value).date()
                    datetime_obj_start = datetime.combine(
                        date_obj, time.min, tzinfo=timezone.utc
                    )
                    query_conditions.append(model_field >= datetime_obj_start)
                elif op_type == "lte_date":
                    date_obj = datetime.fromisoformat(req_value).date()
                    datetime_obj_end = datetime.combine(
                        date_obj, time.max, tzinfo=timezone.utc
                    )
                    query_conditions.append(model_field <= datetime_obj_end)

        # Only apply status conditions if announcementStatus is provided
        if self.announcementStatus is not None:
            today_date = datetime.now(timezone.utc).date()
            today_datetime_start = datetime.combine(
                today_date, time.min, tzinfo=timezone.utc
            )
            today_datetime_end = datetime.combine(
                today_date, time.max, tzinfo=timezone.utc
            )

            if self.announcementStatus == "receiving":
                query_conditions.append(model_cls.begin_date <= today_datetime_end)
                query_conditions.append(model_cls.end_date >= today_datetime_start)
            elif self.announcementStatus == "closed":
                query_conditions.append(model_cls.end_date < today_datetime_start)
            elif self.announcementStatus == "open":
                query_conditions.append(model_cls.end_date >= today_datetime_start)

        return query_conditions

    def get_sort_expression(
        self, model_cls: type[Announcement]
    ) -> QueryExpression | None:
        sort_field_name = self._sort_map.get(self.sortType)

        if not sort_field_name:
            # Default to sorting by 'latest' if sortType is unrecognized or not in map
            # (though "view" is now in the map, this is a fallback)
            sort_field_name = self._sort_map["latest"]
            model_field = getattr(model_cls, sort_field_name)
            return model_field.desc()

        model_field = getattr(model_cls, sort_field_name)

        if self.sortType == "latest":
            return model_field.desc()
        elif self.sortType == "deadline":
            return model_field.asc()
        elif self.sortType == "view":
            return model_field.desc()  # Sort by view_count in descending order

        # Fallback for any other unhandled sortType (should ideally not be reached if validation is strict)
        return getattr(model_cls, self._sort_map["latest"]).desc()


class AnnouncementListResponse(BaseModel):
    items: list[AnnouncementRead]
    totalCount: int


class AnnouncementDetailResponse(BaseModel):
    conditions: list[ConditionResponse]
    categories: list[CategoryResponse]
    pdfUrl: str
    viewCount: int
