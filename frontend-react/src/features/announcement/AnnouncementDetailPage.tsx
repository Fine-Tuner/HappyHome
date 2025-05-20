import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePdfViewer } from "./hooks/detail/usePdfViewer";
import { useGetAnnouncement } from "./api/getAnnouncement";
import { useGetAnnouncementPdf } from "./api/getPdf";
import Tab from "./components/detail/Tab";
import { ACTIVE_TAB, ActiveTabType } from "./types/activeTab";
import BackToListButton from "./components/detail/BackToListButton";
import CategoryList from "./components/detail/CategoryList";
import AddCategory from "./components/detail/AddCategory";
import ResizeHandle from "./components/detail/ResizeHandle";

export default function AnnouncementDetail() {
  const params = useParams();

  const containerRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<ActiveTabType>(ACTIVE_TAB.SUMMARY);
  const [pdfWidth, setPdfWidth] = useState(0);

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
      {/* 정보 Section */}
      <div ref={containerRef}>
        <div
          className="w-1/2 h-screen overflow-y-auto"
          style={{ width: `${pdfWidth}px` }}
        >
          <div className="p-8">
            <BackToListButton />
            <Tab activeTab={activeTab} onTabChange={setActiveTab} />

            <CategoryList
              iframeRef={iframeRef}
              announcementDetailData={announcementDetailData}
            />
            <AddCategory />
          </div>
        </div>
        <ResizeHandle
          containerRef={containerRef}
          pdfWidth={pdfWidth}
          setPdfWidth={setPdfWidth}
        />
      </div>

      {/* PDF Viewer Section */}
      <div className="h-screen relative w-full">
        <iframe
          ref={iframeRef}
          src="/zotero_build/web/reader.html"
          title="PDF Viewer"
          className="w-full h-full"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </div>
    </div>
  );
}
