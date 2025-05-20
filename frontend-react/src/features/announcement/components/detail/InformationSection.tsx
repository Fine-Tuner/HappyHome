import { useState } from "react";
import { useRef } from "react";
import BackToListButton from "./BackToListButton";
import { ACTIVE_TAB, ActiveTabType } from "../../types/activeTab";
import Tab from "./Tab";
import { useGetAnnouncement } from "../../api/getAnnouncement";
import { useParams } from "react-router-dom";
import ResizeHandle from "./ResizeHandle";
import CategoryList from "../../../category/components/CategoryList";
import AddCategory from "../../../category/components/AddCategory";

interface Props {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

export default function InformationSection({ iframeRef }: Props) {
  const params = useParams();

  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<ActiveTabType>(ACTIVE_TAB.SUMMARY);
  const [pdfWidth, setPdfWidth] = useState(0);

  const { data: announcementDetailData } = useGetAnnouncement({
    params: { announcementId: params.id! },
  });

  return (
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
  );
}
