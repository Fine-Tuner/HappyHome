from app.crud.base import CRUDBase
from app.models.llm_analysis_result import LLMAnalysisResult
from app.schemas.llm_analysis_result import (
    LLMAnalysisResultCreate,
    LLMAnalysisResultUpdate,
)


class CRUDAnnouncementAnalysis(
    CRUDBase[LLMAnalysisResult, LLMAnalysisResultCreate, LLMAnalysisResultUpdate]
):
    pass


crud_llm_analysis_result = CRUDAnnouncementAnalysis(LLMAnalysisResult)
