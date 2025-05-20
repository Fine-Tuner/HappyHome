import { ReactNode } from "react";
import { ActiveTabType } from "../../types/activeTab";

interface TabProps {
  activeTab: string;
  onTabChange: (tab: ActiveTabType) => void;
}

export default function Tab({ activeTab, onTabChange }: TabProps) {
  const tabs = [
    { id: "summary", label: "요약정보" },
    { id: "qa", label: "질문과답변" },
    { id: "memo", label: "메모" },
  ];

  return (
    <div className="mb-6">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as ActiveTabType)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
