import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePdfViewer } from "./hooks/detail/usePdfViewer";
import { useGetAnnouncement } from "./api/getAnnouncement";
import { useGetAnnouncementPdf } from "./api/getPdf";
import TabSection from "./components/detail/TabSection";
import { ACTIVE_TAB, ActiveTabType } from "./types/activeTab";
import CategorySection from "./components/detail/CategorySection";
import { useCreateCategory } from "../category/api/postCreate";
import { useQueryClient } from "@tanstack/react-query";
import queryKeys from "./api/queryKey";

export default function AnnouncementDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTabType>(ACTIVE_TAB.SUMMARY);

  const { data: announcementDetail } = useGetAnnouncement({
    params: { announcementId: params.id! },
  });

  const { data: pdfBlob } = useGetAnnouncementPdf({
    params: { announcementId: params.id! },
  });

  const {
    iframeRef,
    readerRef,
    pdfWidth,
    isDragging,
    containerRef,
    handleMouseDown,
    initializePdfViewer,
    iframeLoaded,
  } = usePdfViewer(announcementDetail?.categories, pdfBlob);

  // TopicSection 렌더링에 필요한 최소 상태 및 핸들러
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const [expandedConditions, setExpandedConditions] = useState<
    Record<string, boolean>
  >({});
  const [editedConditions, setEditedConditions] = useState<
    Record<string, string>
  >({});

  // 카테고리(구 Topic) 확장/축소 토글
  const handleToggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // 컨디션(구 Contents) 확장/축소 토글
  const handleToggleCondition = (
    categoryId: string,
    conditionIndex: number,
  ) => {
    const key = `${categoryId}-${conditionIndex}`;
    setExpandedConditions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 컨디션 편집
  const handleConditionEdit = (
    categoryId: string,
    condition: any,
    newCondition: string,
  ) => {
    const key = `${categoryId}-${condition.text}`;
    setEditedConditions((prev) => ({ ...prev, [key]: newCondition }));
  };

  // 컨디션 리셋
  const handleResetCondition = (categoryId: string, condition: any) => {
    const key = `${categoryId}-${condition.text}`;
    setEditedConditions((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  // PDF 위치 하이라이트 클릭 (bbox, page 기반)
  const handleHighlightClick = (
    bbox: { x: number; y: number; width: number; height: number },
    pageNumber: number,
  ) => {
    const innerFrame =
      iframeRef.current?.contentWindow?.document?.querySelector("iframe");
    if (!innerFrame) return;
    const innerFrameWindow = innerFrame.contentWindow;

    const pageWidth = 595;
    const pageHeight = 840;

    const { x, y, width, height } = bbox;
    // 좌측 하단 기준의 좌표를 좌측 상단 기준으로 변환
    const top = ((pageHeight - height) / pageHeight) * 100;
    const left = (x / pageWidth) * 100;
    const widthPercent = ((width - x) / pageWidth) * 100;
    const heightPercent = ((height - y) / pageHeight) * 100;

    const pageElement = innerFrameWindow?.document?.querySelector(
      `.page[data-page-number="${pageNumber}"]`,
    );
    if (!pageElement) return;

    // 기존 하이라이트 제거
    const existingHighlights =
      pageElement.querySelectorAll(".highlight-overlay");
    existingHighlights.forEach((el) => el.remove());

    // 새로운 하이라이트 추가
    const highlightLayer = document.createElement("div");
    highlightLayer.id = "highlight-layer";
    highlightLayer.style.position = "absolute";
    highlightLayer.style.left = `${left}%`;
    highlightLayer.style.top = `${top}%`;
    highlightLayer.style.width = `${widthPercent}%`;
    highlightLayer.style.height = `${heightPercent}%`;
    highlightLayer.style.backgroundColor = "rgba(255, 255, 0, 0.3)";
    highlightLayer.classList.add("highlight-overlay");
    pageElement.appendChild(highlightLayer);

    // 3초 후 하이라이트 제거
    setTimeout(() => {
      highlightLayer.remove();
    }, 3000);

    // 해당 페이지로 스크롤
    pageElement.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // 자유게시판 상태 관리
  const [newPost, setNewPost] = useState("");
  const [newPostAuthor, setNewPostAuthor] = useState("");
  const [commentInputs, setCommentInputs] = useState<
    Record<string, { author: string; text: string }>
  >({});

  // 메모 탭 상태: 단일 텍스트
  const [memoText, setMemoText] = useState("");

  // 카테고리 추가 관련 상태
  const { mutate: createCategory, status: createCategoryStatus } =
    useCreateCategory();
  const isCreatingCategory = createCategoryStatus === "pending";
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryComment, setNewCategoryComment] = useState("");

  const queryClient = useQueryClient();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex">
      <div ref={containerRef}>
        {/* Content Section */}
        <div
          className="w-1/2 h-screen overflow-y-auto"
          style={{ width: `${pdfWidth}px` }}
        >
          <div className="p-8">
            <button
              onClick={() => navigate("/announcements")}
              className="mb-6 flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              목록으로 돌아가기
            </button>

            <TabSection activeTab={activeTab} onTabChange={setActiveTab}>
              {announcementDetail?.categories.map((category) => {
                const conditions = (announcementDetail.conditions || []).filter(
                  (ann) => ann.category_id === category.id,
                );
                return (
                  <CategorySection
                    key={category.id}
                    category={{
                      id: category.id,
                      name: category.name,
                      conditions,
                    }}
                    expandedCategories={expandedCategories}
                    expandedConditions={expandedConditions}
                    editedConditions={editedConditions}
                    conditionAnnotations={{}}
                    comments={{}}
                    newComment={{}}
                    onToggleCategory={handleToggleCategory}
                    onToggleCondition={handleToggleCondition}
                    onConditionEdit={handleConditionEdit}
                    onResetCondition={handleResetCondition}
                    onHighlightClick={handleHighlightClick}
                    onAddComment={() => {}}
                    onDeleteComment={() => {}}
                    onNewCommentChange={() => {}}
                    onAnnotationClick={() => {}}
                  />
                );
              })}
              {/* 카테고리 추가 버튼 및 입력창: 카테고리 Section들 아래에만 노출 */}
              <div className="mt-4 flex flex-col items-center">
                {isAddCategoryOpen ? (
                  <div className="flex flex-col gap-2 w-full max-w-md bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="새 카테고리 이름"
                      className="px-2 py-1 rounded bg-gray-700 border border-gray-600 text-white text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setIsAddCategoryOpen(false)}
                        className="px-3 py-1 text-sm rounded bg-gray-600 text-gray-200 hover:bg-gray-500"
                        disabled={isCreatingCategory}
                      >
                        취소
                      </button>
                      <button
                        onClick={() => {
                          if (!newCategoryName.trim()) return;
                          createCategory(
                            {
                              name: newCategoryName,
                              announcement_id: params.id || "",
                            },
                            {
                              onSuccess: () => {
                                setNewCategoryName("");
                                setIsAddCategoryOpen(false);
                                queryClient.invalidateQueries({
                                  queryKey: queryKeys.detail(params.id!),
                                });
                              },
                            },
                          );
                        }}
                        className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                        disabled={isCreatingCategory || !newCategoryName.trim()}
                      >
                        {isCreatingCategory ? "추가 중..." : "추가"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddCategoryOpen(true)}
                    className="px-4 py-2 mt-2 rounded bg-blue-700 text-white hover:bg-blue-800 text-sm font-semibold shadow"
                  >
                    + 카테고리 추가
                  </button>
                )}
              </div>
            </TabSection>
          </div>
        </div>

        {/* 리사이즈 핸들 */}
        <div
          className={`absolute right-0 top-0 h-full w-2 cursor-col-resize transition-colors duration-150 z-10 ${
            isDragging
              ? "bg-blue-500 dark:bg-blue-600"
              : "bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-600"
          }`}
          style={{ left: `${pdfWidth}px` }}
          onMouseDown={handleMouseDown}
        />
      </div>

      {/* PDF Viewer Section */}
      <div className="h-screen relative w-full">
        <iframe
          ref={iframeRef}
          src="/zotero_build/web/reader.html"
          title="PDF Viewer"
          className="w-full h-full"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </div>
    </div>
  );
}
