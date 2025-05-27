import { useState } from "react";
import { useRef } from "react";
import BackToListButton from "./BackToListButton";
import { ACTIVE_TAB, ActiveTabType } from "../../types/activeTab";
import Tab from "./Tab";
import { useGetAnnouncement } from "../../api/getAnnouncement";
import { useParams } from "react-router-dom";
import ResizeHandle from "./ResizeHandle";
import CategoryContainerList from "../../../category/components/CategoryContainerList";
import AddCategory from "../../../category/components/AddCategory";
import QuestionList from "../../../qa/components/QuestionList";

interface Props {
  iframeRef: React.RefObject<HTMLIFrameElement>;
}

export default function InformationSection({ iframeRef }: Props) {
  const [activeTab, setActiveTab] = useState<ActiveTabType>(ACTIVE_TAB.SUMMARY);

  const renderTabContent = () => {
    switch (activeTab) {
      case ACTIVE_TAB.SUMMARY:
        return (
          <>
            <CategoryContainerList iframeRef={iframeRef} />
            <AddCategory />
          </>
        );
      case ACTIVE_TAB.QA:
        return <QuestionList />;
      case ACTIVE_TAB.MEMO:
        return (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                메모
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                개인적인 메모와 노트를 작성하고 관리할 수 있습니다.
              </p>
            </div>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-gray-400"
                >
                  <path
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                메모 기능 준비 중
              </h3>
              <p className="text-gray-500 dark:text-gray-400">2026.07</p>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      <div className="h-screen overflow-y-auto">
        <div className="p-8">
          <BackToListButton />
          <Tab activeTab={activeTab} onTabChange={setActiveTab} />
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
