import { useParams } from "react-router-dom";
import { useDeleteCategory } from "../api/delete";
import { CategoryWithConditions } from "../types/categoryWithConditions";
import { useConfirm } from "../../../shared/components/Confirm/useConfirm";
import ConfirmAlert from "../../../shared/components/Confirm/ConfirmAlert";

interface Props {
  category: CategoryWithConditions;
  expandedCategories: Record<string, boolean>;
  onToggleCategory: (categoryId: string) => void;
  setIsCategoryMemoOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsEditingTitle: React.Dispatch<React.SetStateAction<boolean>>;
  setEditedTitle: React.Dispatch<React.SetStateAction<string>>;
}
export default function CategoryOptions({
  category,
  expandedCategories,
  onToggleCategory,
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
      <div className="flex items-center gap-1" style={{ minHeight: "32px" }}>
        {/* 요약 메모 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!expandedCategories[category.id]) {
              onToggleCategory(category.id);
            }
            setIsCategoryMemoOpen((prev) => !prev);
          }}
          // className={
          //   (categoryHovered
          //     ? "opacity-100 pointer-events-auto"
          //     : "opacity-0 pointer-events-none") +
          //   " transition-opacity duration-150 flex-shrink-0 flex items-center justify-center w-8 h-8 text-xs " +
          //   (categoryMemo
          //     ? "bg-purple-500/30 text-purple-200"
          //     : "bg-green-500/20 text-green-200") +
          //   " rounded-md hover:bg-purple-500/40 relative"
          // }
          // title={categoryMemo ? "요약 메모 보기" : "요약 메모 추가"}
        >
          <svg
            width="16"
            height="16"
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
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!expandedCategories[category.id]) {
              onToggleCategory(category.id);
            }
            // onResetCondition &&
            //   onResetCondition(category.id, category.conditions[0]);
          }}
          className={
            // (categoryHovered
            //   ? "opacity-100 pointer-events-auto"
            //   : "opacity-0 pointer-events-none") +
            " transition-opacity duration-150 flex-shrink-0 flex items-center justify-center w-8 h-8 text-xs bg-blue-500/20 text-blue-300 rounded-md hover:bg-blue-500/40"
          }
          title="새 컨디션 추가"
        >
          <svg
            width="16"
            height="16"
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
        </button>
        {/* 제목 수정 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditingTitle(true);
            setEditedTitle(category.name);
          }}
          className={
            // (categoryHovered
            //   ? "opacity-100 pointer-events-auto"
            //   : "opacity-0 pointer-events-none") +
            " transition-opacity duration-150 flex-shrink-0 flex items-center justify-center w-8 h-8 text-xs bg-yellow-500/20 text-yellow-300 rounded-md hover:bg-yellow-500/40"
          }
          title="주제 제목 수정"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11 5H6C4.89543 5 4 5.89543 4 7V18C4 19.1046 4.89543 20 6 20H17C18.1046 20 19 19.1046 19 18V13"
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
          className={
            // (categoryHovered
            //   ? "opacity-100 pointer-events-auto"
            //   : "opacity-0 pointer-events-none") +
            " transition-opacity duration-150 flex-shrink-0 flex items-center justify-center w-8 h-8 text-xs bg-red-500/20 text-red-300 rounded-md hover:bg-red-500/40"
          }
          title="주제 삭제"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 18L18 6M6 6l12 12"
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
