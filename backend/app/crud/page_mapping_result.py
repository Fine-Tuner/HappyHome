from app.crud.base import CRUDBase
from app.models.page_mapping_result import PageMappingResult
from app.schemas.page_mapping_result import (
    PageMappingResultCreate,
    PageMappingResultUpdate,
)


class CRUDPageMappingResult(
    CRUDBase[PageMappingResult, PageMappingResultCreate, PageMappingResultUpdate]
):
    pass


crud_page_mapping_result = CRUDPageMappingResult(PageMappingResult)
