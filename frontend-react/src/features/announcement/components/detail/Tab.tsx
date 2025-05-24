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
      <div className="flex items-center justify-center">
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
      </div>
    </div>
  );
}
