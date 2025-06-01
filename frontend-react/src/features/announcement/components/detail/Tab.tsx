import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ActiveTabType } from "../../types/activeTab";
import ThemeToggle from "../../../theme/components/ThemeToggle";

interface TabProps {
  activeTab: string;
  onTabChange: (tab: ActiveTabType) => void;
  showExpandCollapseButtons?: boolean;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  isAllExpanded?: boolean;
  isAllCollapsed?: boolean;
}

export default function Tab({
  activeTab,
  onTabChange,
  showExpandCollapseButtons = false,
  onExpandAll,
  onCollapseAll,
  isAllExpanded = false,
  isAllCollapsed = true,
}: TabProps) {
  const navigate = useNavigate();
  const [clickedTab, setClickedTab] = useState<string | null>(null);

  const tabs = [
    { id: "summary", label: "요약정보" },
    { id: "qa", label: "질문과답변" },
    { id: "memo", label: "메모" },
  ];

  // 현재 활성 탭의 정보 가져오기
  const activeTabInfo = tabs.find((tab) => tab.id === activeTab);
  const pageTitle = activeTabInfo?.label || "요약정보";

  // 각 탭별 설명
  const getDescription = (tabId: string) => {
    switch (tabId) {
      case "summary":
        return "공고문의 핵심 내용을 요약했습니다. 자유롭게 편집하고 메모를 추가할 수 있습니다.";
      case "qa":
        return "궁금한 점을 질문하거나 정보를 공유할 수 있습니다.";
      case "memo":
        return "개인적인 메모와 노트를 작성하고 관리할 수 있습니다.";
      default:
        return "";
    }
  };

  const handleTabClick = (tabId: ActiveTabType) => {
    if (tabId !== activeTab) {
      setClickedTab(tabId);
      onTabChange(tabId);

      // 애니메이션 후 클릭 상태 초기화
      setTimeout(() => {
        setClickedTab(null);
      }, 500);
    }
  };

  return (
    <div className="mb-4">
      {/* 상단 네비게이션 */}
      <div className="flex items-center justify-between mb-1">
        {/* 좌측: 네비게이션 링크들 */}
        <div className="flex items-center text-lg">
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.id;
            const isClicked = clickedTab === tab.id;

            return (
              <div key={tab.id} className="flex items-center">
                <button
                  onClick={() => handleTabClick(tab.id as ActiveTabType)}
                  className={`relative pb-1 overflow-hidden transition-colors duration-300 ${
                    isActive
                      ? "text-white dark:text-white font-bold"
                      : "text-gray-600 dark:text-gray-500 hover:text-white dark:hover:text-white font-medium"
                  }`}
                >
                  {tab.label}

                  {/* 밑줄 애니메이션 */}
                  <div
                    className={`absolute bottom-0 left-0 h-0.5 transition-all duration-300 ${
                      isActive
                        ? isClicked
                          ? "w-full bg-gradient-to-r from-white via-blue-100 to-white shadow-sm shadow-blue-200/50"
                          : "w-full bg-gradient-to-r from-white/80 via-white to-white/80"
                        : "w-0 bg-white/60"
                    }`}
                    style={{
                      transformOrigin: "left",
                    }}
                  />
                </button>
                <span className="mx-3 text-gray-400/60 dark:text-gray-500/60 pb-1">
                  |
                </span>
              </div>
            );
          })}

          <button
            onClick={() => navigate("/announcements")}
            className="flex items-center text-gray-600 dark:text-gray-500 hover:text-white dark:hover:text-white transition-colors duration-200 pb-1"
          >
            <svg
              className="w-4 h-4 mr-1.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            뒤로가기
          </button>
        </div>

        {/* 우측: 테마 토글 */}
        <ThemeToggle />
      </div>

      {/* 설명과 펼치기/접기 버튼 */}
      <div className="flex items-center justify-between min-h-[30px]">
        <p className="text-sm text-gray-300 dark:text-gray-400">
          {getDescription(activeTab)}
        </p>

        {/* 요약정보 탭일 때만 펼치기/접기 버튼 표시 */}
        {showExpandCollapseButtons && onExpandAll && onCollapseAll && (
          <div className="flex items-center gap-2">
            <button
              onClick={onExpandAll}
              disabled={isAllExpanded}
              className={`w-[30px] h-[30px] flex items-center justify-center rounded-md border transition-all duration-200 ${
                isAllExpanded
                  ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-600 cursor-not-allowed"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
              }`}
              title="모든 카테고리 펼치기"
            >
              <svg
                width="14"
                height="14"
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
            </button>

            <button
              onClick={onCollapseAll}
              disabled={isAllCollapsed}
              className={`w-[30px] h-[30px] flex items-center justify-center rounded-md border transition-all duration-200 ${
                isAllCollapsed
                  ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-600 cursor-not-allowed"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
              }`}
              title="모든 카테고리 접기"
            >
              <svg
                width="14"
                height="14"
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
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
