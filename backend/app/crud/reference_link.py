from app.crud.base import CRUDBase
from app.models.reference_link import ReferenceLink
from app.schemas.reference_link import ReferenceLinkCreate, ReferenceLinkUpdate


class CRUDReferenceLink(
    CRUDBase[ReferenceLink, ReferenceLinkCreate, ReferenceLinkUpdate]
):
    pass


crud_reference_link = CRUDReferenceLink(ReferenceLink)
