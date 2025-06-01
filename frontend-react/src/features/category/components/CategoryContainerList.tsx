import CategoryContainer from "./CategoryContainer";
import { useGetAnnouncement } from "../../announcement/api/getAnnouncement";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

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

export default function CategoryContainerList({ iframeRef }: Props) {
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

  return (
    <div className="mt-4">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              요약정보
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              공고문의 핵심 내용을 요약했습니다. 자유롭게 편집하고 메모를 추가할
              수 있습니다.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              모든 내용은 개인적으로 저장됩니다.
            </p>
          </div>

          {/* 전체 펼치기/접기 버튼 */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExpandAll}
              disabled={isAllExpanded}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all duration-200 ${
                isAllExpanded
                  ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-600 cursor-not-allowed"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
              }`}
              title="모든 카테고리 펼치기"
            >
              <div className="flex items-center gap-1">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="transform rotate-0"
                >
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                전체 펼치기
              </div>
            </button>

            <button
              onClick={handleCollapseAll}
              disabled={isAllCollapsed}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all duration-200 ${
                isAllCollapsed
                  ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-600 cursor-not-allowed"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
              }`}
              title="모든 카테고리 접기"
            >
              <div className="flex items-center gap-1">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="transform rotate-180"
                >
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                전체 접기
              </div>
            </button>
          </div>
        </div>
      </div>
      {announcementDetailData?.categories.map((category) => {
        // 조건 필터링 로직 개선: id와 original_id 둘 다 확인
        const conditions = (announcementDetailData.conditions || []).filter(
          (condition) =>
            condition.category_id === category.id ||
            condition.category_id === category.original_id,
        );

        return (
          <CategoryContainer
            key={category.id}
            category={{
              ...category,
              conditions,
            }}
            iframeRef={iframeRef}
            expandedCategories={expandedCategories}
            onToggleCategory={handleToggleCategory}
          />
        );
      })}
    </div>
  );
}
