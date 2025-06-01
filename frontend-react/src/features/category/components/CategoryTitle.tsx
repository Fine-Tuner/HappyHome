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
        <div className="flex items-center gap-1 w-3/4">
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
          {/* <button
            onClick={(e) => {
              e.stopPropagation();
              handleSaveCategoryTitle();
            }}
            className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            저장
          </button> */}
        </div>
      ) : (
        <div className="flex items-center w-full">
          {/* 제목 영역 - 전체 클릭 가능 */}
          <h3
            className="text-sm font-semibold text-teal-400 hover:text-emerald-300 transition-colors flex items-center cursor-pointer flex-1 py-1"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleCategory(category.id);
            }}
            title={
              expandedCategories[category.id]
                ? "클릭하여 접기"
                : "클릭하여 펼치기"
            }
          >
            {/* 펼치기/접기 화살표 아이콘 */}
            <svg
              className={`w-4 h-4 transform transition-transform duration-200 mr-2 flex-shrink-0 ${
                expandedCategories[category.id] ? "rotate-90" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>

            {/* 제목 텍스트와 뱃지 그룹 */}
            <div className="flex items-center flex-1">
              <span>{category.name}</span>
              <span
                className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/20"
                title="컨디션 개수"
              >
                {localConditions.length}
              </span>
            </div>
          </h3>
        </div>
      )}
    </div>
  );
}
