from app.crud.base import CRUDBase
from app.models.llm_output import LLMOutput
from app.schemas.llm_output import LLMOutputCreate, LLMOutputUpdate


class CRUDAnnouncementAnalysis(CRUDBase[LLMOutput, LLMOutputCreate, LLMOutputUpdate]):
    pass


crud_llm_output = CRUDAnnouncementAnalysis(LLMOutput)
