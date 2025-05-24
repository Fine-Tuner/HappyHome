import { useParams } from "react-router-dom";
import { useDeleteCategory } from "../api/delete";
import { CategoryWithConditions } from "../types/categoryWithConditions";
import { useConfirm } from "../../../shared/components/Confirm/useConfirm";
import ConfirmAlert from "../../../shared/components/Confirm/ConfirmAlert";

interface Props {
  category: CategoryWithConditions;
  expandedCategories: Record<string, boolean>;
  onToggleCategory: (categoryId: string) => void;
  isCategoryMemoOpen: boolean;
  setIsCategoryMemoOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsEditingTitle: React.Dispatch<React.SetStateAction<boolean>>;
  setEditedTitle: React.Dispatch<React.SetStateAction<string>>;
}
export default function CategoryOptions({
  category,
  expandedCategories,
  onToggleCategory,
  isCategoryMemoOpen,
  setIsCategoryMemoOpen,
  setIsEditingTitle,
  setEditedTitle,
}: Props) {
  const params = useParams();
  const { mutate: deleteCategory } = useDeleteCategory(params.id!);

  const { alertState, openConfirmAlert, closeConfirmAlert, handleConfirm } =
    useConfirm();

  return (
    <>
      <div
        className="flex items-center gap-1 absolute right-[10px] bg-black/20 dark:bg-black/30 backdrop-blur-sm rounded-md border border-white/10 px-2 py-1"
        style={{ zIndex: 10 }}
      >
        {/* 제목 수정 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditingTitle(true);
            setEditedTitle(category.name);
          }}
          className="flex-shrink-0 flex items-center justify-center w-5 h-5 text-white/70 hover:text-emerald-300 transition-colors duration-200"
          title="주제 제목 수정"
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
        {/* 요약 메모 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!expandedCategories[category.id]) {
              onToggleCategory(category.id);
            }
            setIsCategoryMemoOpen((prev) => !prev);
          }}
          className={`flex-shrink-0 flex items-center justify-center w-5 h-5 transition-all duration-300 ${
            category.comment && category.comment.trim() !== ""
              ? "text-teal-300"
              : "text-white/70 hover:text-emerald-300"
          }`}
          style={
            category.comment && category.comment.trim() !== ""
              ? {
                  textShadow: `
              0 0 8px rgba(20, 184, 166, 0.8),
              0 0 16px rgba(20, 184, 166, 0.6),
              0 0 24px rgba(20, 184, 166, 0.4)
            `,
                  filter: `
              drop-shadow(0 0 6px rgba(20, 184, 166, 0.7))
              drop-shadow(0 0 12px rgba(20, 184, 166, 0.5))
              drop-shadow(0 0 20px rgba(20, 184, 166, 0.3))
            `,
                }
              : {}
          }
          title="요약 메모"
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
        {/* 컨디션 추가 버튼 */}
        {/* <button
          onClick={(e) => {
            e.stopPropagation();
            if (!expandedCategories[category.id]) {
              onToggleCategory(category.id);
            }
            // onResetCondition &&
            //   onResetCondition(category.id, category.conditions[0]);
          }}
          className={`flex-shrink-0 flex items-center justify-center w-8 h-8 text-xs bg-blue-500/30 text-blue-300 rounded-full hover:bg-blue-500/50 transition-all duration-200 hover:scale-110 shadow-lg backdrop-blur-sm border border-blue-400/20 ${
            isHover ? "animate-slideUp animate-delay-200" : ""
          }`}
          title="새 컨디션 추가"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 5V19M5 12H19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button> */}
        {/* Cateogory 삭제 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            openConfirmAlert(
              "정말 이 주제를 삭제하시겠습니까?",
              () => {
                deleteCategory(category.id);
              },
              "삭제",
            );
          }}
          className="flex-shrink-0 flex items-center justify-center w-5 h-5 text-red-400 hover:text-red-300 transition-colors duration-200"
          title="주제 삭제"
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
      <ConfirmAlert
        isOpen={alertState.isOpen}
        message={alertState.message}
        onConfirm={handleConfirm}
        onCancel={closeConfirmAlert}
      />
    </>
  );
}
