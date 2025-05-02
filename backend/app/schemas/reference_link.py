from pydantic import BaseModel


class ReferenceLinkCreate(BaseModel):
    announcement_id: str
    condition_id: str
    block_id: str


class ReferenceLinkUpdate(BaseModel):
    pass
