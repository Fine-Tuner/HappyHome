import { useParams, useNavigate } from "react-router-dom";
import { useGetAnnouncement } from "../features/announcement/api/getAnnouncement";
import { useGetAnnouncementPdf } from "../features/announcement/api/getPdf";
import InformationSection from "../features/announcement/components/detail/InformationSection";
import PDFSection from "../features/announcement/components/detail/PDFSection";
import { usePdfViewer } from "../features/announcement/hooks/detail/usePdfViewer";

export default function AnnouncementDetail() {
  const params = useParams();

  const { data: announcementDetailData } = useGetAnnouncement({
    params: { announcementId: params.id! },
  });
  const { data: pdfBlob } = useGetAnnouncementPdf({
    params: { announcementId: params.id! },
  });
  const { iframeRef } = usePdfViewer(
    announcementDetailData?.categories,
    pdfBlob,
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex">
      <InformationSection iframeRef={iframeRef} />
      <PDFSection iframeRef={iframeRef} />
    </div>
  );
}
