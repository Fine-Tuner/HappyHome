import { useState, useEffect } from "react";
import { useRef } from "react";
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

// localStorage 키 상수
const EXPANDED_CATEGORIES_KEY = "happyhome_expanded_categories";

// localStorage에서 카테고리 펼침 상태 가져오기
const getExpandedCategoriesFromStorage = (): Record<string, boolean> => {
  try {
    const stored = localStorage.getItem(EXPANDED_CATEGORIES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error(
      "Failed to parse expanded categories from localStorage:",
      error,
    );
    return {};
  }
};

// localStorage에 카테고리 펼침 상태 저장하기
const saveExpandedCategoriesToStorage = (
  expandedCategories: Record<string, boolean>,
) => {
  try {
    localStorage.setItem(
      EXPANDED_CATEGORIES_KEY,
      JSON.stringify(expandedCategories),
    );
  } catch (error) {
    console.error("Failed to save expanded categories to localStorage:", error);
  }
};

export default function InformationSection({ iframeRef }: Props) {
  const [activeTab, setActiveTab] = useState<ActiveTabType>(ACTIVE_TAB.SUMMARY);
  const params = useParams();
  const { data: announcementDetailData } = useGetAnnouncement({
    params: { announcementId: params.id! },
  });

  // 전체 카테고리의 펼침/접힘 상태 관리
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >(() => {
    return getExpandedCategoriesFromStorage();
  });

  // expandedCategories가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    saveExpandedCategoriesToStorage(expandedCategories);
  }, [expandedCategories]);

  // 카테고리 토글 핸들러
  const handleToggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId], // 기본값은 false (접힌 상태)
    }));
  };

  // 전체 펼치기 핸들러
  const handleExpandAll = () => {
    if (!announcementDetailData?.categories) return;

    const allExpanded: Record<string, boolean> = {};
    announcementDetailData.categories.forEach((category) => {
      allExpanded[category.id] = true;
    });
    setExpandedCategories(allExpanded);
  };

  // 전체 접기 핸들러
  const handleCollapseAll = () => {
    if (!announcementDetailData?.categories) return;

    const allCollapsed: Record<string, boolean> = {};
    announcementDetailData.categories.forEach((category) => {
      allCollapsed[category.id] = false;
    });
    setExpandedCategories(allCollapsed);
  };

  // 현재 전체 상태 확인
  const isAllExpanded =
    announcementDetailData?.categories.every(
      (category) => expandedCategories[category.id] === true,
    ) ?? false;

  const isAllCollapsed =
    announcementDetailData?.categories.every(
      (category) => expandedCategories[category.id] !== true,
    ) ?? true;

  const renderTabContent = () => {
    switch (activeTab) {
      case ACTIVE_TAB.SUMMARY:
        return (
          <>
            <CategoryContainerList
              iframeRef={iframeRef}
              expandedCategories={expandedCategories}
              onToggleCategory={handleToggleCategory}
            />
            <AddCategory />
          </>
        );
      case ACTIVE_TAB.QA:
        return <QuestionList />;
      case ACTIVE_TAB.MEMO:
        return (
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
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full bg-gray-900 dark:bg-gray-900">
      <div className="h-screen overflow-y-auto">
        <div className="p-8">
          <Tab
            activeTab={activeTab}
            onTabChange={setActiveTab}
            // 요약정보 탭일 때만 펼치기/접기 버튼 관련 props 전달
            showExpandCollapseButtons={activeTab === ACTIVE_TAB.SUMMARY}
            onExpandAll={handleExpandAll}
            onCollapseAll={handleCollapseAll}
            isAllExpanded={isAllExpanded}
            isAllCollapsed={isAllCollapsed}
          />
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
