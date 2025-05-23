import { useState } from "react";
import { updateCategory, useUpdateCategory } from "../api/putUpdate";
import { Category, Condition } from "../../announcement/api/getAnnouncement";
import { useParams } from "react-router-dom";
import { CategoryWithConditions } from "../types/categoryWithConditions";

interface Props {
  category: CategoryWithConditions;
  localConditions: Condition[];
  expandedCategories: Record<string, boolean>;
  handleToggleCategory: (categoryId: string) => void;
  isEditingTitle: boolean;
  editedTitle: string;
  setIsEditingTitle: React.Dispatch<React.SetStateAction<boolean>>;
  setEditedTitle: React.Dispatch<React.SetStateAction<string>>;
}

export default function CategoryTitle({
  category,
  localConditions,
  expandedCategories,
  handleToggleCategory,
  isEditingTitle,
  editedTitle,
  setIsEditingTitle,
  setEditedTitle,
}: Props) {
  const params = useParams();

  const { mutate: updateCategory } = useUpdateCategory(params.id!);

  const handleSaveCategoryTitle = () => {
    if (editedTitle.trim() && editedTitle !== category.name) {
      updateCategory({
        id: category.id,
        name: editedTitle,
      });
    }
    setIsEditingTitle(false);
  };

  return (
    <div className="flex items-center flex-1">
      {isEditingTitle ? (
        <div className="flex items-center gap-1 w-full">
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="flex-1 px-2 py-1 text-sm rounded bg-gray-700 border border-gray-600 text-white"
            autoFocus
            onBlur={handleSaveCategoryTitle}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSaveCategoryTitle();
              }
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSaveCategoryTitle();
            }}
            className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            저장
          </button>
        </div>
      ) : (
        <div
          className="flex items-center cursor-pointer w-full"
          onClick={() => handleToggleCategory(category.id)}
        >
          <h3
            className="text-base font-semibold text-gray-800 dark:text-gray-100 hover:text-blue-400 transition-colors flex items-center pl-2"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
              setEditedTitle(category.name);
            }}
            title="더블클릭하여 제목 수정"
          >
            {category.name}
            <span
              className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium rounded-full bg-blue-500/20 text-blue-200"
              title="컨디션 개수"
            >
              {localConditions.length}
            </span>
            {/* 요약 메모 개수 뱃지 */}
            {/* {totalConditionMemoCount > 0 && (
          <span
            className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium rounded-full bg-indigo-500/20 text-indigo-200"
            title="컨디션 전체 메모 개수"
          >
            메모:{totalConditionMemoCount}
          </span>
        )} */}
          </h3>
          <svg
            className={`w-4 h-4 text-gray-500 dark:text-gray-400 transform transition-transform duration-200 ml-2 ${
              expandedCategories[category.id] ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
