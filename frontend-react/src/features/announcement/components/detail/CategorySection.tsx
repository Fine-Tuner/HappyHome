import { ContentItem } from "../../types/announcementDetail";
import { useState, useRef, useEffect } from "react";
import { useDeleteCondition } from "../../../condition/api/delete";
import { useParams } from "react-router-dom";
import ConfirmAlert from "../../../../shared/components/ConfirmAlert";
import { useUpdateCategory } from "../../../category/api/putUpdate";
import { useDeleteCategory } from "../../../category/api/delete";
import { useUpdateCondition } from "../../../condition/api/putUpdate";
import { useDeleteCondition as useDeleteConditionApi } from "../../../condition/api/delete";

interface Memo {
  id: string;
  content: string;
  createdAt: string;
}

interface CategorySectionProps {
  category: {
    id: string;
    name: string;
    conditions: ContentItem[];
  };
  expandedCategories: Record<string, boolean>;
  expandedConditions: Record<string, boolean>;
  editedConditions: Record<string, string>;
  conditionAnnotations: Record<string, any>;
  comments: Record<string, any>;
  newComment: Record<string, any>;
  onToggleCategory: (categoryId: string) => void;
  onToggleCondition: (categoryId: string, conditionIndex: number) => void;
  onConditionEdit: (
    categoryId: string,
    condition: ContentItem,
    newCondition: string,
  ) => void;
  onResetCondition: (categoryId: string, condition: ContentItem) => void;
  onHighlightClick: (bbox: any, page: number) => void;
  onAddComment: () => void;
  onDeleteComment: () => void;
  onNewCommentChange: () => void;
  onAnnotationClick: () => void;
}

export default function CategorySection({
  category,
  expandedCategories,
  expandedConditions,
  editedConditions,
  conditionAnnotations,
  comments,
  newComment,
  onToggleCategory,
  onToggleCondition,
  onConditionEdit,
  onResetCondition,
  onHighlightClick,
  onAddComment,
  onDeleteComment,
  onNewCommentChange,
  onAnnotationClick,
}: CategorySectionProps) {
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [memos, setMemos] = useState<Record<string, Memo[]>>({});
  const [newMemo, setNewMemo] = useState<Record<string, string>>({});
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [editingMemoValue, setEditingMemoValue] = useState<string>("");
  const [expandedMemoSections, setExpandedMemoSections] = useState<
    Record<string, boolean>
  >({});

  // Topic 제목 편집 상태
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(category.name);

  // 알럿창 상태 관리
  const [alertState, setAlertState] = useState({
    isOpen: false,
    message: "",
    confirmAction: () => {},
    buttonLabel: "",
  });

  const { mutate: deleteCondition } = useDeleteCondition();
  const [localConditions, setLocalConditions] = useState(category.conditions);
  useEffect(() => {
    setLocalConditions(category.conditions);
  }, [category.conditions]);

  const params = useParams();
  const { mutate: updateCategory } = useUpdateCategory(params.id!);
  const { mutate: deleteCategory } = useDeleteCategory(params.id!);
  const { mutate: updateCondition } = useUpdateCondition();
  const { mutate: deleteConditionApi } = useDeleteConditionApi();

  // 알럿창 열기
  const openConfirmAlert = (
    message: string,
    confirmAction: () => void,
    buttonLabel: string,
  ) => {
    setAlertState({
      isOpen: true,
      message,
      confirmAction,
      buttonLabel,
    });
  };

  // 알럿창 닫기
  const closeConfirmAlert = () => {
    setAlertState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  };

  // 확인 버튼 클릭 시
  const handleConfirm = () => {
    alertState.confirmAction();
    closeConfirmAlert();
  };

  const toggleMemoSection = (contentKey: string) => {
    setExpandedMemoSections((prev) => ({
      ...prev,
      [contentKey]: !prev[contentKey],
    }));
  };

  const handleAddMemo = (contentKey: string) => {
    const value = (newMemo[contentKey] || "").trim();
    if (!value) return;
    const memo: Memo = {
      id: `${Date.now()}-${Math.random()}`,
      content: value,
      createdAt: new Date().toISOString(),
    };
    setMemos((prev) => ({
      ...prev,
      [contentKey]: [...(prev[contentKey] || []), memo],
    }));
    setNewMemo((prev) => ({ ...prev, [contentKey]: "" }));
  };

  const handleDeleteMemo = (contentKey: string, memoId: string) => {
    setMemos((prev) => ({
      ...prev,
      [contentKey]: (prev[contentKey] || []).filter((m) => m.id !== memoId),
    }));
  };

  const handleEditMemo = (memoId: string, content: string) => {
    setEditingMemoId(memoId);
    setEditingMemoValue(content);
  };

  const handleSaveMemo = (contentKey: string, memoId: string) => {
    setMemos((prev) => ({
      ...prev,
      [contentKey]: (prev[contentKey] || []).map((m) =>
        m.id === memoId ? { ...m, content: editingMemoValue } : m,
      ),
    }));
    setEditingMemoId(null);
    setEditingMemoValue("");
  };

  const handleCancelEditMemo = () => {
    setEditingMemoId(null);
    setEditingMemoValue("");
  };

  const handleContentClick = (topicId: string, content: ContentItem) => {
    setEditingContentId(`${topicId}-${content.content}`);
  };

  const handleContentEdit = (
    topicId: string,
    content: ContentItem,
    newContent: string,
  ) => {
    onConditionEdit(topicId, content, newContent);
  };

  const handleContentBlur = () => {
    setEditingContentId(null);
  };

  // 컨텐츠 전체 메모 개수 계산
  const totalContentMemoCount = category.conditions.reduce((sum, content) => {
    const contentKey = `${category.id}-${content.content}`;
    return sum + (memos[contentKey]?.length || 0);
  }, 0);

  const [topicHovered, setTopicHovered] = useState(false);
  const [contentHovered, setContentHovered] = useState<Record<number, boolean>>(
    {},
  );

  // 삭제 핸들러
  const handleDeleteCondition = (conditionId: string) => {
    deleteCondition(
      {
        user_condition_id: conditionId,
        announcement_id: params.id!,
      },
      {
        onSuccess: () => {
          setLocalConditions((prev) =>
            prev.filter((c) => c.id !== conditionId),
          );
        },
      },
    );
  };

  // 카테고리명 저장(수정) 핸들러
  const handleSaveCategoryTitle = () => {
    if (editedTitle.trim() && editedTitle !== category.name) {
      updateCategory({
        id: category.id,
        name: editedTitle,
      });
    }
    setIsEditingTitle(false);
  };

  // Condition(컨디션) 저장(수정) 핸들러
  const handleSaveCondition = (content: ContentItem) => {
    updateCondition({
      params: {
        announcement_id: params.id!,
        user_condition_id: content.id,
        user_id: "", // 실제 유저 ID로 교체 필요
      },
      body: {
        content:
          editedConditions[`${category.id}-${content.content}`] ??
          content.content,
        comment: "", // 필요시 수정
        category_id: category.id,
        bbox: [
          content.bbox.x,
          content.bbox.y,
          content.bbox.width,
          content.bbox.height,
        ],
        is_deleted: false,
        updated_at: new Date().toISOString(),
      },
    });
    setEditingContentId(null);
  };

  // 카테고리(주제) 메모 상태: 1개만
  const [categoryMemo, setCategoryMemo] = useState("");
  const [isCategoryMemoOpen, setIsCategoryMemoOpen] = useState(false);

  // 컨디션별 메모 상태: 1개만
  const [conditionMemos, setConditionMemos] = useState<Record<string, string>>(
    {},
  );
  const [openConditionMemo, setOpenConditionMemo] = useState<string | null>(
    null,
  );

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-md p-2 border border-gray-200 dark:border-gray-700"
      onMouseEnter={() => setTopicHovered(true)}
      onMouseLeave={() => setTopicHovered(false)}
    >
      <div className="flex items-center justify-between">
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
              onClick={() => onToggleCategory(category.id)}
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
                  title="컨텐츠 개수"
                >
                  {category.conditions.length}
                </span>
                {/* 요약 메모 개수 뱃지 */}
                {totalContentMemoCount > 0 && (
                  <span
                    className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium rounded-full bg-indigo-500/20 text-indigo-200"
                    title="컨텐츠 전체 메모 개수"
                  >
                    메모:{totalContentMemoCount}
                  </span>
                )}
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

        {/* 햄버거 메뉴 버튼 */}
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
            className={
              (topicHovered
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none") +
              " transition-opacity duration-150 flex-shrink-0 flex items-center justify-center w-8 h-8 text-xs " +
              (categoryMemo
                ? "bg-purple-500/30 text-purple-200"
                : "bg-green-500/20 text-green-200") +
              " rounded-md hover:bg-purple-500/40 relative"
            }
            title={categoryMemo ? "요약 메모 보기" : "요약 메모 추가"}
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
          {/* 컨텐츠 추가 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!expandedCategories[category.id]) {
                onToggleCategory(category.id);
              }
              onResetCondition &&
                onResetCondition(category.id, category.conditions[0]);
            }}
            className={
              (topicHovered
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none") +
              " transition-opacity duration-150 flex-shrink-0 flex items-center justify-center w-8 h-8 text-xs bg-blue-500/20 text-blue-300 rounded-md hover:bg-blue-500/40"
            }
            title="새 컨텐츠 추가"
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
              (topicHovered
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none") +
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
          {/* Topic 초기화 버튼 */}
          {/* 주제 삭제 버튼 */}
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
              (topicHovered
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none") +
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
      </div>
      {expandedCategories[category.id] && (
        <>
          {/* 카테고리 메모: 버튼을 눌렀을 때만 펼침 */}
          {isCategoryMemoOpen && (
            <div className="mt-2 mb-2 px-2">
              <textarea
                className="w-full p-2 text-xs rounded bg-gray-700 border border-purple-400 text-white"
                rows={3}
                value={categoryMemo}
                onChange={(e) => setCategoryMemo(e.target.value)}
                onBlur={() => {
                  updateCategory({
                    id: category.id,
                    comment: categoryMemo,
                  });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    (e.target as HTMLTextAreaElement).blur();
                  }
                }}
                placeholder="주제 요약 메모를 입력하세요"
              />
            </div>
          )}

          <div className="space-y-2">
            {localConditions.map((content, index) => {
              const contentKey = `${category.id}-${content.content}`;
              const memoCount = memos[contentKey]?.length || 0;
              const isExpanded = expandedMemoSections[contentKey];
              // 동적 border 색상
              const borderColor = content.color || "#3b82f6"; // 없으면 기존 blue-500
              return (
                <div
                  key={index}
                  className="bg-gray-800/80 dark:bg-gray-700 rounded-lg pl-2 pr-2 py-2 flex flex-col shadow-sm border-l-4 border-t-0 border-r-0 border-b-0 ml-2 my-1"
                  style={{ borderLeftColor: borderColor }}
                  data-content-id={contentKey}
                  onMouseEnter={() =>
                    setContentHovered((prev) => ({ ...prev, [index]: true }))
                  }
                  onMouseLeave={() =>
                    setContentHovered((prev) => ({ ...prev, [index]: false }))
                  }
                >
                  <div className="flex items-start gap-2 pl-2">
                    <div className="flex-1 flex items-center">
                      {editingContentId === contentKey ? (
                        <textarea
                          className="w-full p-1.5 text-xs rounded-lg border border-blue-400 focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white"
                          rows={2}
                          value={
                            editedConditions[contentKey] ?? content.content
                          }
                          onChange={(e) =>
                            handleContentEdit(
                              category.id,
                              content,
                              e.target.value,
                            )
                          }
                          onBlur={() => handleSaveCondition(content)}
                          autoFocus
                        />
                      ) : (
                        <div
                          className="p-1.5 text-sm text-white bg-transparent hover:bg-gray-700/50 rounded-lg cursor-pointer transition flex items-center"
                          onClick={() =>
                            handleContentClick(category.id, content)
                          }
                        >
                          {editedConditions[contentKey] ?? content.content}
                          {/* 메모 개수 뱃지 */}
                          {memos[contentKey]?.length > 0 && (
                            <span
                              className="ml-2 inline-flex items-center justify-center px-1 py-0.5 text-xs font-medium rounded-full bg-indigo-500/20 text-indigo-200"
                              title="메모 개수"
                            >
                              메모:{memos[contentKey].length}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div
                      className="flex items-center gap-1 self-start"
                      style={{ minHeight: "32px" }}
                    >
                      {/* PDF 위치 찾기 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onHighlightClick(content.bbox, content.page);
                        }}
                        className={
                          (contentHovered[index]
                            ? "opacity-100 pointer-events-auto"
                            : "opacity-0 pointer-events-none") +
                          " transition-opacity duration-150 flex-shrink-0 flex items-center justify-center w-8 h-8 text-blue-200 bg-blue-500/20 rounded-md hover:bg-blue-500/30"
                        }
                        title="PDF에서 해당 내용의 위치 찾기"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle
                            cx="12"
                            cy="10"
                            r="3"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      {/* 메모 보기/수정 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (openConditionMemo !== contentKey) {
                            setOpenConditionMemo(contentKey);
                          } else {
                            setOpenConditionMemo(null);
                          }
                        }}
                        className={
                          (contentHovered[index]
                            ? "opacity-100 pointer-events-auto"
                            : "opacity-0 pointer-events-none") +
                          " transition-opacity duration-150 flex-shrink-0 flex items-center justify-center w-8 h-8 text-green-200 bg-green-500/20 rounded-md hover:bg-green-500/30"
                        }
                        title="컨텐츠에 메모 추가/수정하기"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      {/* 컨디션 삭제 버튼 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openConfirmAlert(
                            "정말 이 항목을 삭제하시겠습니까?",
                            () => {
                              deleteConditionApi({
                                user_condition_id: content.id,
                                announcement_id: params.id!,
                                user_id: "", // 실제 유저 ID로 교체 필요
                              });
                            },
                            "삭제",
                          );
                        }}
                        className={
                          (contentHovered[index]
                            ? "opacity-100 pointer-events-auto"
                            : "opacity-0 pointer-events-none") +
                          " transition-opacity duration-150 flex-shrink-0 flex items-center justify-center w-8 h-8 text-red-200 bg-red-500/20 rounded-md hover:bg-red-500/30"
                        }
                        title="이 컨텐츠 항목 삭제하기"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M10 11V17"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M14 11V17"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M3 7H21"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M7 7L9 3H15L17 7"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {/* 메모 textarea를 버튼 옆이 아니라, 컨디션 전체 아래(세로)로 위치 */}
                  {openConditionMemo === contentKey && (
                    <div className="mt-2 px-2">
                      <textarea
                        className="w-full p-2 text-xs rounded bg-gray-700 border border-green-400 text-white"
                        rows={2}
                        value={conditionMemos[contentKey] || ""}
                        onChange={(e) =>
                          setConditionMemos((prev) => ({
                            ...prev,
                            [contentKey]: e.target.value,
                          }))
                        }
                        onBlur={() => {
                          updateCondition({
                            params: {
                              announcement_id: params.id!,
                              user_condition_id: content.id,
                              user_id: "", // 실제 유저 ID로 교체 필요
                            },
                            body: {
                              content: content.content,
                              comment: conditionMemos[contentKey] || "",
                              category_id: category.id,
                              bbox: [
                                content.bbox.x,
                                content.bbox.y,
                                content.bbox.width,
                                content.bbox.height,
                              ],
                              is_deleted: false,
                              updated_at: new Date().toISOString(),
                            },
                          });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            (e.target as HTMLTextAreaElement).blur();
                          }
                        }}
                        placeholder="메모를 입력하세요"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 커스텀 알럿 컴포넌트 */}
      <ConfirmAlert
        isOpen={alertState.isOpen}
        message={alertState.message}
        onConfirm={handleConfirm}
        onCancel={closeConfirmAlert}
        buttonLabel={alertState.buttonLabel || "삭제"}
      />
    </div>
  );
}
