import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ActiveTabType } from "../../types/activeTab";

interface TabProps {
  activeTab: string;
  onTabChange: (tab: ActiveTabType) => void;
}

export default function Tab({ activeTab, onTabChange }: TabProps) {
  const navigate = useNavigate();

  const tabs = [
    { id: "summary", label: "요약정보" },
    { id: "qa", label: "질문과답변" },
    { id: "memo", label: "메모" },
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {/* 좌측: 목록으로 돌아가기 버튼 */}
        <button
          onClick={() => navigate("/announcements")}
          className="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
        >
          <svg
            className="w-5 h-5 mr-2"
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
          목록으로 돌아가기
        </button>

        {/* 중앙: 탭들 */}
        <div className="bg-teal-50 dark:bg-teal-900/20 p-1 rounded-lg flex space-x-1 border border-teal-100 dark:border-teal-800/30">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as ActiveTabType)}
              className={`
                px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
                ${
                  activeTab === tab.id
                    ? "bg-teal-900 text-white shadow-lg shadow-teal-500/10"
                    : "text-teal-700 dark:text-teal-300 hover:text-teal-800 dark:hover:text-teal-200 hover:bg-teal-100 dark:hover:bg-teal-800/30"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 우측: 균형을 위한 빈 공간 */}
        <div className="w-[140px]" />
      </div>
    </div>
  );
}
