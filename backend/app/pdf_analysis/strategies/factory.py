from app.enums import AnnouncementType
from app.pdf_analysis.strategies.base import PDFAnalysisStrategy
from app.pdf_analysis.strategies.public_lease import PublicLeaseAnalysisStrategy
from app.pdf_analysis.strategies.public_sale import PublicSaleAnalysisStrategy


def get_strategy(announcement_type: AnnouncementType) -> PDFAnalysisStrategy:
    if announcement_type == AnnouncementType.PUBLIC_LEASE:
        return PublicLeaseAnalysisStrategy()
    elif announcement_type == AnnouncementType.PUBLIC_SALE:
        return PublicSaleAnalysisStrategy()
    else:
        raise ValueError(f"Unsupported announcement type: {announcement_type}")
