import { useState } from "react";
import { Condition as ConditionType } from "../../announcement/api/getAnnouncement";
import Condition from "./Condition";
import ConditionMemo from "./ConditionMemo";

interface Props {
  localConditions: ConditionType[];
  iframeRef: React.RefObject<HTMLIFrameElement>;
}

export default function ConditionList({ localConditions, iframeRef }: Props) {
  const [hoveredCondition, setHoveredCondition] = useState<string | null>(null);
  const [editingCondition, setEditingCondition] = useState<string | null>(null);
  const [editedText, setEditedText] = useState<string>("");
  const [openMemo, setOpenMemo] = useState<string | null>(null);

  const handleEditStart = (conditionId: string, currentText: string) => {
    setEditingCondition(conditionId);
    setEditedText(currentText);
  };

  const handleEditSave = (conditionId: string) => {
    // TODO: API 호출로 업데이트
    console.log("Saving condition:", conditionId, editedText);
    setEditingCondition(null);
  };

  const handleEditCancel = () => {
    setEditingCondition(null);
    setEditedText("");
  };

  const handleDelete = (conditionId: string) => {
    // TODO: 삭제 확인 후 API 호출
    console.log("Deleting condition:", conditionId);
  };

  const handleMemo = (conditionId: string) => {
    setOpenMemo(openMemo === conditionId ? null : conditionId);
  };

  return (
    <div className="pl-6 pr-2 pb-2 space-y-1">
      {localConditions.map((condition, index) => {
        const bulletColor = condition.color || "#3b82f6";
        const isHovered = hoveredCondition === condition.id;
        const isEditing = editingCondition === condition.id;

        return (
          <div
            key={index}
            className={`flex items-start gap-2 relative group px-2 py-1 rounded-md transition-all duration-200 ${
              isHovered
                ? "bg-gray-50 dark:bg-gray-700/50 shadow-sm"
                : "hover:bg-gray-50/50 dark:hover:bg-gray-700/30"
            }`}
            data-condition-id={condition.id}
            onMouseEnter={() => setHoveredCondition(condition.id)}
            onMouseLeave={() => setHoveredCondition(null)}
          >
            {/* 간단한 원형 불릿 */}
            <div
              className="w-1.5 h-0.5 rounded-full mt-2.5 flex-shrink-0"
              style={{
                backgroundColor: bulletColor,
                boxShadow: `
                  0 0 8px 1px ${bulletColor}40,
                  0 0 12px 1px ${bulletColor}20,
                  0 0 16px 1px ${bulletColor}10
                `,
              }}
            />

            {/* 텍스트 영역 */}
            <div className="flex-1 relative">
              {isEditing ? (
                <textarea
                  className="w-full p-1.5 text-sm rounded border border-blue-400 focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  onBlur={() => handleEditSave(condition.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleEditSave(condition.id);
                    }
                    if (e.key === "Escape") {
                      handleEditCancel();
                    }
                  }}
                  autoFocus
                  rows={2}
                />
              ) : (
                <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {condition.text}
                </div>
              )}

              {/* 저장된 메모 표시 */}
              {!isEditing && condition.comment && openMemo !== condition.id && (
                <div className="mt-2 mb-1 p-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                  {condition.comment}
                </div>
              )}

              {/* 메모 편집 영역 */}
              <ConditionMemo
                condition={condition}
                isOpen={openMemo === condition.id}
                onClose={() => setOpenMemo(null)}
              />

              {/* 버튼들 - hover 시에만 표시 */}
              {isHovered && !isEditing && (
                <div className="absolute right-0 top-0 flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md px-2 py-1 shadow-md">
                  {/* 수정 버튼 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditStart(condition.id, condition.text);
                    }}
                    className="flex-shrink-0 flex items-center justify-center w-5 h-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                    title="수정"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M11 5H6C4.89543 5 4 5.89543 4 7V18C4 19.1046 4.89543 20 6 20H17C18.1046 20 19 18V13"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M17.5 3.5C18.3284 2.67157 19.6716 2.67157 20.5 3.5C21.3284 4.32843 21.3284 5.67157 20.5 6.5L12 15L8 16L9 12L17.5 3.5Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {/* 메모 버튼 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMemo(condition.id);
                    }}
                    className={`flex-shrink-0 flex items-center justify-center w-5 h-5 transition-colors duration-200 ${
                      condition.comment
                        ? "text-teal-500 hover:text-teal-600 dark:text-teal-400 dark:hover:text-teal-300"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                    title={condition.comment ? "메모 수정" : "메모 추가"}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {/* 삭제 버튼 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(condition.id);
                    }}
                    className="flex-shrink-0 flex items-center justify-center w-5 h-5 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
                    title="삭제"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6"
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
      })}
    </div>
  );
}
