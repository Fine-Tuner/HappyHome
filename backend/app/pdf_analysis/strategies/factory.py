from app.enums import AnnouncementType
from app.pdf_analysis.strategies.base import PDFInformationExtractionStrategy
from app.pdf_analysis.strategies.public_lease import (
    PublicLeaseInformationExtractionStrategy,
)
from app.pdf_analysis.strategies.public_sale import (
    PublicSaleInformationExtractionStrategy,
)


def get_strategy(
    announcement_type: AnnouncementType,
) -> PDFInformationExtractionStrategy:
    if announcement_type == AnnouncementType.PUBLIC_LEASE:
        return PublicLeaseInformationExtractionStrategy()
    elif announcement_type == AnnouncementType.PUBLIC_SALE:
        return PublicSaleInformationExtractionStrategy()
