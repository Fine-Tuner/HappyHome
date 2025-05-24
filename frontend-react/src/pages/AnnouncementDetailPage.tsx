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
    <div
      className="flex min-h-screen bg-white dark:bg-gradient-to-br"
      style={
        {
          "--tw-gradient-from": "#000000",
          "--tw-gradient-to": "#292e49",
          "--tw-gradient-stops":
            "var(--tw-gradient-from), var(--tw-gradient-to)",
        } as React.CSSProperties
      }
    >
      <PDFSection iframeRef={iframeRef} />
      <InformationSection
        iframeRef={iframeRef as React.RefObject<HTMLIFrameElement>}
      />
    </div>
  );
}
