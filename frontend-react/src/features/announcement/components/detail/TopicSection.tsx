import { ContentItem } from "../../types/announcementDetail";
import { useState, useRef, useEffect } from "react";

interface Memo {
  id: string;
  content: string;
  createdAt: string;
}

interface TopicSectionProps {
  topic: {
    id: string;
    topic: string;
    contents: ContentItem[];
  };
  expandedTopics: Record<string, boolean>;
  expandedContents: Record<string, boolean>;
  editedContents: Record<string, string>;
  contentAnnotations: { [key: string]: any[] };
  comments: Record<string, any[]>;
  newComment: Record<string, string>;
  onToggleTopic: (topicId: string) => void;
  onToggleContent: (topicId: string, contentIndex: number) => void;
  onContentEdit: (
    topicId: string,
    content: ContentItem,
    newContent: string,
  ) => void;
  onResetContent: (topicId: string, content: ContentItem) => void;
  onHighlightClick: (annotationId: string) => void;
  onAddComment: (topicId: string, content: string) => void;
  onDeleteComment: (
    topicId: string,
    content: string,
    commentId: string,
  ) => void;
  onNewCommentChange: (topicId: string, content: string, value: string) => void;
  onAnnotationClick: (annotationId: string) => void;
  onDeleteContent?: (topicId: string, contentIndex: number) => void;
  onDeleteTopic?: (topicId: string) => void;
  onEditTopicTitle?: (topicId: string, newTitle: string) => void;
}

// 커스텀 알럿 타입 정의
interface ConfirmAlertProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// 커스텀 알럿 컴포넌트
const ConfirmAlert = ({
  isOpen,
  message,
  onConfirm,
  onCancel,
}: ConfirmAlertProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fadeIn">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-w-md w-full mx-4 overflow-hidden animate-scaleIn">
        <div className="p-5">
          <div className="text-white text-base mb-5">{message}</div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition"
            >
              취소
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            >
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function TopicSection({
  topic,
  expandedTopics,
  expandedContents,
  editedContents,
  contentAnnotations,
  comments,
  newComment,
  onToggleTopic,
  onToggleContent,
  onContentEdit,
  onResetContent,
  onHighlightClick,
  onAddComment,
  onDeleteComment,
  onNewCommentChange,
  onAnnotationClick,
  onDeleteContent,
  onDeleteTopic,
  onEditTopicTitle,
}: TopicSectionProps) {
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [memos, setMemos] = useState<Record<string, Memo[]>>({});
  const [newMemo, setNewMemo] = useState<Record<string, string>>({});
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [editingMemoValue, setEditingMemoValue] = useState<string>("");
  const [expandedMemoSections, setExpandedMemoSections] = useState<
    Record<string, boolean>
  >({});

  const [topicMemos, setTopicMemos] = useState<Record<string, Memo[]>>({});
  const [newTopicMemo, setNewTopicMemo] = useState<Record<string, string>>({});
  const [editingTopicMemoId, setEditingTopicMemoId] = useState<string | null>(
    null,
  );
  const [editingTopicMemoValue, setEditingTopicMemoValue] =
    useState<string>("");
  const [expandedTopicMemoSections, setExpandedTopicMemoSections] = useState<
    Record<string, boolean>
  >({});

  // Topic 제목 편집 상태
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(topic.topic);

  // 알럿창 상태 관리
  const [alertState, setAlertState] = useState({
    isOpen: false,
    message: "",
    confirmAction: () => {},
  });

  // 알럿창 열기
  const openConfirmAlert = (message: string, confirmAction: () => void) => {
    setAlertState({
      isOpen: true,
      message,
      confirmAction,
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

  const toggleTopicMemoSection = (topicId: string) => {
    setExpandedTopicMemoSections((prev) => ({
      ...prev,
      [topicId]: !prev[topicId],
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

  const handleAddTopicMemo = (topicId: string) => {
    const value = (newTopicMemo[topicId] || "").trim();
    if (!value) return;
    const memo: Memo = {
      id: `topic-${Date.now()}-${Math.random()}`,
      content: value,
      createdAt: new Date().toISOString(),
    };
    setTopicMemos((prev) => ({
      ...prev,
      [topicId]: [...(prev[topicId] || []), memo],
    }));
    setNewTopicMemo((prev) => ({ ...prev, [topicId]: "" }));
  };

  const handleDeleteMemo = (contentKey: string, memoId: string) => {
    setMemos((prev) => ({
      ...prev,
      [contentKey]: (prev[contentKey] || []).filter((m) => m.id !== memoId),
    }));
  };

  const handleDeleteTopicMemo = (topicId: string, memoId: string) => {
    setTopicMemos((prev) => ({
      ...prev,
      [topicId]: (prev[topicId] || []).filter((m) => m.id !== memoId),
    }));
  };

  const handleEditMemo = (memoId: string, content: string) => {
    setEditingMemoId(memoId);
    setEditingMemoValue(content);
  };

  const handleEditTopicMemo = (memoId: string, content: string) => {
    setEditingTopicMemoId(memoId);
    setEditingTopicMemoValue(content);
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

  const handleSaveTopicMemo = (topicId: string, memoId: string) => {
    setTopicMemos((prev) => ({
      ...prev,
      [topicId]: (prev[topicId] || []).map((m) =>
        m.id === memoId ? { ...m, content: editingTopicMemoValue } : m,
      ),
    }));
    setEditingTopicMemoId(null);
    setEditingTopicMemoValue("");
  };

  const handleCancelEditMemo = () => {
    setEditingMemoId(null);
    setEditingMemoValue("");
  };

  const handleCancelEditTopicMemo = () => {
    setEditingTopicMemoId(null);
    setEditingTopicMemoValue("");
  };

  const handleContentClick = (topicId: string, content: ContentItem) => {
    setEditingContentId(`${topicId}-${content.content}`);
  };

  const handleContentEdit = (
    topicId: string,
    content: ContentItem,
    newContent: string,
  ) => {
    onContentEdit(topicId, content, newContent);
  };

  const handleContentBlur = () => {
    setEditingContentId(null);
  };

  // 컨텐츠 전체 메모 개수 계산
  const totalContentMemoCount = topic.contents.reduce((sum, content) => {
    const contentKey = `${topic.id}-${content.content}`;
    return sum + (memos[contentKey]?.length || 0);
  }, 0);

  const [topicHovered, setTopicHovered] = useState(false);
  const [contentHovered, setContentHovered] = useState<Record<number, boolean>>(
    {},
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
                onBlur={() => {
                  if (
                    editedTitle.trim() !== "" &&
                    editedTitle !== topic.topic
                  ) {
                    onEditTopicTitle && onEditTopicTitle(topic.id, editedTitle);
                  }
                  setIsEditingTitle(false);
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    if (
                      editedTitle.trim() !== "" &&
                      editedTitle !== topic.topic
                    ) {
                      onEditTopicTitle &&
                        onEditTopicTitle(topic.id, editedTitle);
                    }
                    setIsEditingTitle(false);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (
                    editedTitle.trim() !== "" &&
                    editedTitle !== topic.topic
                  ) {
                    onEditTopicTitle && onEditTopicTitle(topic.id, editedTitle);
                  }
                  setIsEditingTitle(false);
                }}
                className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          ) : (
            <div
              className="flex items-center cursor-pointer w-full"
              onClick={() => onToggleTopic(topic.id)}
            >
              <h3
                className="text-base font-semibold text-gray-800 dark:text-gray-100 hover:text-blue-400 transition-colors flex items-center pl-2"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setIsEditingTitle(true);
                  setEditedTitle(topic.topic);
                }}
                title="더블클릭하여 제목 수정"
              >
                {topic.topic}
                <span
                  className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium rounded-full bg-blue-500/20 text-blue-200"
                  title="컨텐츠 개수"
                >
                  {topic.contents.length}
                </span>
                {/* 요약 메모 개수 뱃지 */}
                {topicMemos[topic.id]?.length > 0 && (
                  <span
                    className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium rounded-full bg-purple-500/20 text-purple-200"
                    title="요약 메모 개수"
                  >
                    요약:{topicMemos[topic.id].length}
                  </span>
                )}
                {/* 컨텐츠 전체 메모 개수 뱃지 */}
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
                  expandedTopics[topic.id] ? "rotate-180" : ""
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
              toggleTopicMemoSection(topic.id);
              if (!expandedTopics[topic.id]) {
                onToggleTopic(topic.id);
              }
              setTimeout(() => {
                const input = document.querySelector(
                  `input[data-topic-memo-input="${topic.id}"]`,
                ) as HTMLInputElement;
                input?.focus();
              }, 100);
            }}
            className={
              (topicHovered
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none") +
              " transition-opacity duration-150 flex-shrink-0 flex items-center justify-center w-8 h-8 text-xs " +
              (topicMemos[topic.id]?.length > 0
                ? "bg-purple-500/30 text-purple-200"
                : "bg-green-500/20 text-green-200") +
              " rounded-md hover:bg-purple-500/40 relative"
            }
            title={
              topicMemos[topic.id]?.length > 0
                ? "요약 메모 보기"
                : "요약 메모 추가"
            }
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
              if (!expandedTopics[topic.id]) {
                onToggleTopic(topic.id);
              }
              onDeleteContent && onDeleteContent(topic.id, -1);
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
              setEditedTitle(topic.topic);
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
              openConfirmAlert("정말 이 주제를 삭제하시겠습니까?", () => {
                onDeleteTopic && onDeleteTopic(topic.id);
              });
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
      {expandedTopics[topic.id] && (
        <>
          <div className="mt-2 mb-2">
            {expandedTopicMemoSections[topic.id] && (
              <div className="mt-1.5 border-t border-gray-700 pt-1.5 px-2">
                <div className="flex gap-1 mb-1.5">
                  <input
                    type="text"
                    data-topic-memo-input={topic.id}
                    value={newTopicMemo[topic.id] || ""}
                    onChange={(e) =>
                      setNewTopicMemo((prev) => ({
                        ...prev,
                        [topic.id]: e.target.value,
                      }))
                    }
                    placeholder="주제 요약 메모를 입력하세요"
                    className="flex-1 px-2 py-1 text-xs rounded bg-gray-700/80 border border-gray-600 text-white"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddTopicMemo(topic.id);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleAddTopicMemo(topic.id)}
                    className="px-2 py-0.5 text-xs font-semibold rounded bg-purple-600 text-white hover:bg-purple-700"
                  >
                    등록
                  </button>
                </div>
                {topicMemos[topic.id]?.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {(topicMemos[topic.id] || []).map((memo) => (
                      <div
                        key={memo.id}
                        className="bg-purple-900/30 rounded p-1.5 flex flex-col"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-purple-200">
                            {new Date(memo.createdAt).toLocaleDateString(
                              "ko-KR",
                            )}
                          </span>
                          <div className="flex gap-1">
                            {editingTopicMemoId === memo.id ? (
                              <>
                                <button
                                  className="text-xs text-green-400 hover:text-green-600 px-1"
                                  onClick={() =>
                                    handleSaveTopicMemo(topic.id, memo.id)
                                  }
                                >
                                  저장
                                </button>
                                <button
                                  className="text-xs text-gray-400 hover:text-gray-600 px-1"
                                  onClick={handleCancelEditTopicMemo}
                                >
                                  취소
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="text-xs text-yellow-300 hover:text-yellow-500 px-1"
                                  onClick={() =>
                                    handleEditTopicMemo(memo.id, memo.content)
                                  }
                                >
                                  수정
                                </button>
                                <button
                                  className="text-xs text-red-400 hover:text-red-600 px-1"
                                  onClick={() =>
                                    handleDeleteTopicMemo(topic.id, memo.id)
                                  }
                                >
                                  삭제
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {editingTopicMemoId === memo.id ? (
                          <textarea
                            className="w-full mt-1 p-1 text-xs rounded bg-gray-800 border border-purple-400 text-white"
                            rows={2}
                            value={editingTopicMemoValue}
                            onChange={(e) =>
                              setEditingTopicMemoValue(e.target.value)
                            }
                            autoFocus
                          />
                        ) : (
                          <span className="text-xs text-gray-200 mt-1">
                            {memo.content}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            {topic.contents.map((content, index) => {
              const contentKey = `${topic.id}-${content.content}`;
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
                          value={editedContents[contentKey] ?? content.content}
                          onChange={(e) =>
                            handleContentEdit(topic.id, content, e.target.value)
                          }
                          onBlur={handleContentBlur}
                          autoFocus
                        />
                      ) : (
                        <div
                          className="p-1.5 text-sm text-white bg-transparent hover:bg-gray-700/50 rounded-lg cursor-pointer transition flex items-center"
                          onClick={() => handleContentClick(topic.id, content)}
                        >
                          {editedContents[contentKey] ?? content.content}
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
                          onHighlightClick(content.id);
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
                      {/* 메모 보기/추가 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMemoSection(contentKey);
                          setTimeout(() => {
                            const input = document.querySelector(
                              `input[data-memo-input='${contentKey}']`,
                            ) as HTMLInputElement;
                            input?.focus();
                          }, 100);
                        }}
                        className={
                          (contentHovered[index]
                            ? "opacity-100 pointer-events-auto"
                            : "opacity-0 pointer-events-none") +
                          " transition-opacity duration-150 flex-shrink-0 flex items-center justify-center w-8 h-8 text-green-200 bg-green-500/20 rounded-md hover:bg-green-500/30"
                        }
                        title="컨텐츠에 메모 추가하기"
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
                      {/* 컨텐츠 삭제 */}
                      {onDeleteContent && topic.contents.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openConfirmAlert(
                              "정말 이 항목을 삭제하시겠습니까?",
                              () => {
                                onDeleteContent(topic.id, index);
                              },
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
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-1.5 border-t border-gray-700 pt-1.5 px-3">
                      <div className="flex gap-1 mb-1.5">
                        <input
                          type="text"
                          data-memo-input={contentKey}
                          value={newMemo[contentKey] || ""}
                          onChange={(e) =>
                            setNewMemo((prev) => ({
                              ...prev,
                              [contentKey]: e.target.value,
                            }))
                          }
                          placeholder="메모를 입력하세요"
                          className="flex-1 px-2 py-1 text-xs rounded bg-gray-700/80 border border-gray-600 text-white"
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              handleAddMemo(contentKey);
                            }
                          }}
                        />
                        <button
                          onClick={() => handleAddMemo(contentKey)}
                          className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700"
                        >
                          등록
                        </button>
                      </div>
                      {memoCount > 0 && (
                        <div className="space-y-1">
                          {(memos[contentKey] || []).map((memo) => (
                            <div
                              key={memo.id}
                              className="bg-gray-700/60 rounded p-1.5 flex flex-col"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-blue-200">
                                  {new Date(memo.createdAt).toLocaleDateString(
                                    "ko-KR",
                                  )}
                                </span>
                                <div className="flex gap-1">
                                  {editingMemoId === memo.id ? (
                                    <>
                                      <button
                                        className="text-xs text-green-400 hover:text-green-600 px-1"
                                        onClick={() =>
                                          handleSaveMemo(contentKey, memo.id)
                                        }
                                      >
                                        저장
                                      </button>
                                      <button
                                        className="text-xs text-gray-400 hover:text-gray-600 px-1"
                                        onClick={handleCancelEditMemo}
                                      >
                                        취소
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        className="text-xs text-yellow-300 hover:text-yellow-500 px-1"
                                        onClick={() =>
                                          handleEditMemo(memo.id, memo.content)
                                        }
                                      >
                                        수정
                                      </button>
                                      <button
                                        className="text-xs text-red-400 hover:text-red-600 px-1"
                                        onClick={() =>
                                          handleDeleteMemo(contentKey, memo.id)
                                        }
                                      >
                                        삭제
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                              {editingMemoId === memo.id ? (
                                <textarea
                                  className="w-full mt-1 p-1 text-xs rounded bg-gray-800 border border-blue-400 text-white"
                                  rows={2}
                                  value={editingMemoValue}
                                  onChange={(e) =>
                                    setEditingMemoValue(e.target.value)
                                  }
                                  autoFocus
                                />
                              ) : (
                                <span className="text-xs text-gray-200 mt-1">
                                  {memo.content}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
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
      />
    </div>
  );
}
