import { useState, useEffect, useRef } from "react";
import { updateCategory, useUpdateCategory } from "../api/putUpdate";
import { useParams } from "react-router-dom";
import { CategoryWithConditions } from "../types/categoryWithConditions";

interface Props {
  isCategoryMemoOpen: boolean;
  category: CategoryWithConditions;
  setIsCategoryMemoOpen: React.Dispatch<React.SetStateAction<boolean>>;
  expandedCategories: Record<string, boolean>;
  onToggleCategory: (categoryId: string) => void;
}

export default function CategoryMemo({
  isCategoryMemoOpen,
  category,
  setIsCategoryMemoOpen,
  expandedCategories,
  onToggleCategory,
}: Props) {
  const params = useParams();
  const [categoryMemo, setCategoryMemo] = useState(category.comment || "");
  const { mutate: updateCategoryMutation } = useUpdateCategory(params.id!);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // category 변경 시 메모 상태 업데이트
  useEffect(() => {
    setCategoryMemo(category.comment || "");
  }, [category.comment]);

  // 메모가 열릴 때마다 현재 메모 내용으로 초기화
  useEffect(() => {
    if (isCategoryMemoOpen) {
      setCategoryMemo(category.comment || "");
      // 다음 렌더링 사이클에서 커서를 맨 뒤로 이동
      setTimeout(() => {
        if (textareaRef.current) {
          const length = textareaRef.current.value.length;
          textareaRef.current.setSelectionRange(length, length);
        }
      }, 0);
    }
  }, [isCategoryMemoOpen, category.comment]);

  const handleSaveMemo = () => {
    updateCategoryMutation({
      id: category.id,
      comment: categoryMemo,
    });
    setIsCategoryMemoOpen(false);
  };

  const handleCancelEdit = () => {
    setCategoryMemo(category.comment || "");
    setIsCategoryMemoOpen(false);
  };

  return (
    <>
      {/* 편집 모드 - 메모 버튼을 누르면 바로 textarea */}
      {isCategoryMemoOpen && expandedCategories[category.id] && (
        <div className="mt-3 mb-2 px-4">
          <div className="relative">
            <textarea
              className="w-full p-4 text-sm rounded-xl bg-gradient-to-br from-teal-900/30 to-slate-800/30 border-0 ring-1 ring-teal-400/20 text-teal-100 placeholder-teal-300/50 focus:ring-2 focus:ring-teal-300/60 backdrop-blur-xl transition-all duration-300 resize-none shadow-lg"
              rows={3}
              value={categoryMemo}
              onChange={(e) => setCategoryMemo(e.target.value)}
              onBlur={handleSaveMemo}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveMemo();
                }
                if (e.key === "Escape") {
                  handleCancelEdit();
                }
              }}
              placeholder="주제에 대한 요약 메모를 작성해보세요..."
              autoFocus
              style={{
                background: `linear-gradient(135deg,
                  rgba(13, 148, 136, 0.1) 0%,
                  rgba(30, 41, 59, 0.2) 100%)`,
                boxShadow: `
                  0 4px 6px -1px rgba(0, 0, 0, 0.1),
                  0 2px 4px -1px rgba(0, 0, 0, 0.06),
                  inset 0 1px 0 rgba(255, 255, 255, 0.05)
                `,
              }}
              ref={textareaRef}
            />

            {/* 우측 하단 힌트 */}
            <div className="absolute bottom-2 right-3 flex items-center gap-2 text-[10px] text-teal-300/40">
              <span>Enter로 저장</span>
              <span>•</span>
              <span>Esc로 취소</span>
            </div>
          </div>
        </div>
      )}

      {/* 표시 모드 - 저장된 메모를 텍스트로 표시 */}
      {!isCategoryMemoOpen && category.comment && (
        <div className="mb-2 px-4">
          <div
            className="text-[11px] leading-relaxed text-teal-200/90 bg-gradient-to-r from-teal-900/20 to-transparent px-3 py-2 rounded-lg border-l-3 border-teal-400/40 cursor-pointer hover:from-teal-900/30 hover:to-teal-900/10 transition-all duration-200 backdrop-blur-sm"
            onClick={() => {
              if (!expandedCategories[category.id]) {
                onToggleCategory(category.id);
              }
              setIsCategoryMemoOpen(true);
            }}
            title="클릭하여 메모 수정"
            style={{
              boxShadow: `
                0 1px 3px 0 rgba(0, 0, 0, 0.1),
                0 1px 2px 0 rgba(0, 0, 0, 0.06)
              `,
            }}
          >
            <div className="flex items-start gap-2">
              <span className="flex-1">{category.comment}</span>
              <svg
                className="w-3 h-3 text-teal-400/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
