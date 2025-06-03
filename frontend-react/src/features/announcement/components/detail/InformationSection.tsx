import { useState, useEffect, useRef } from "react";
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

  // 보이지 않는 카테고리들의 ID 목록 관리
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);

  // 스크롤 컨테이너 ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // Intersection Observer 설정
  useEffect(() => {
    if (
      activeTab !== ACTIVE_TAB.SUMMARY ||
      !announcementDetailData?.categories
    ) {
      setHiddenCategories([]);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        console.log("Observer entries:", entries.length); // 디버깅용

        setHiddenCategories((prev) => {
          const newHidden = new Set(prev);

          // 모든 변경사항을 한 번에 처리
          entries.forEach((entry) => {
            const categoryId = entry.target.getAttribute("data-category-id");
            const categoryName =
              entry.target.getAttribute("data-category-name");

            console.log(
              `Category: ${categoryName}, isIntersecting: ${entry.isIntersecting}, boundingRect:`,
              entry.boundingClientRect,
            ); // 디버깅용

            if (!categoryId) return;

            if (entry.isIntersecting) {
              // 카테고리가 보이면 스택에서 제거
              newHidden.delete(categoryId);
              console.log(`Removed from hidden: ${categoryName}`); // 디버깅용
            } else {
              // 카테고리가 보이지 않을 때, 위쪽으로 사라진 경우만 스택에 추가
              const rect = entry.boundingClientRect;
              if (rect.bottom < 0) {
                newHidden.add(categoryId);
                console.log(`Added to hidden: ${categoryName}`); // 디버깅용
              }
            }
          });

          // 카테고리 순서대로 정렬하여 반환
          const orderedCategories =
            announcementDetailData?.categories
              ?.filter((cat) => newHidden.has(cat.id))
              .map((cat) => cat.id) || [];

          console.log("Final hidden categories:", orderedCategories); // 디버깅용
          return orderedCategories;
        });
      },
      {
        threshold: 0,
        // root 제거 - 기본 viewport 사용
      },
    );

    // DOM에서 카테고리 엘리먼트들을 찾아서 관찰
    const observeCategories = () => {
      const categoryElements = document.querySelectorAll("[data-category-id]");
      categoryElements.forEach((element) => {
        observer.observe(element);
      });
    };

    // 약간의 지연 후 관찰 시작 (DOM 렌더링 대기)
    const timeoutId = setTimeout(observeCategories, 100);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [activeTab, announcementDetailData?.categories]);

  // 카테고리로 스크롤하는 함수
  const scrollToCategory = (categoryId: string) => {
    const categoryElement = document.querySelector(
      `[data-category-id="${categoryId}"]`,
    );
    if (categoryElement && scrollContainerRef.current) {
      const containerRect = scrollContainerRef.current.getBoundingClientRect();
      const elementRect = categoryElement.getBoundingClientRect();
      const scrollTop = scrollContainerRef.current.scrollTop;

      // 상단 여백을 고려하여 스크롤 위치 계산
      const targetScroll =
        scrollTop + elementRect.top - containerRect.top - 120; // 120px 여백

      scrollContainerRef.current.scrollTo({
        top: targetScroll,
        behavior: "smooth",
      });
    }
  };

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

  // 숨겨진 카테고리들의 정보 가져오기
  const hiddenCategoryData = hiddenCategories
    .map((id) =>
      announcementDetailData?.categories.find((cat) => cat.id === id),
    )
    .filter((category): category is NonNullable<typeof category> =>
      Boolean(category),
    );

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
          <div className="py-12 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full dark:bg-gray-800">
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
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
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
    <div className="relative w-full bg-gray-900 dark:bg-gray-900">
      <div className="h-screen overflow-y-auto">
        {/* Hidden Categories Navigation - InformationSection 내부에 sticky로 변경 */}
        {hiddenCategoryData.length > 0 && activeTab === ACTIVE_TAB.SUMMARY && (
          <div className="sticky top-0 z-10 px-4 py-3 border-b border-gray-700 shadow-lg bg-gray-800/95 dark:bg-gray-800/95 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-300 whitespace-nowrap">
                숨겨진 카테고리:
              </span>
              <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-hide">
                <div className="flex gap-2 min-w-max">
                  {hiddenCategoryData.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => scrollToCategory(category.id)}
                      className="flex-shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors duration-200 whitespace-nowrap font-medium shadow-sm hover:shadow-md"
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

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
