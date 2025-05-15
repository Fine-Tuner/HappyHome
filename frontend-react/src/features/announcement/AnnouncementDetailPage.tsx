import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePdfViewer } from "./hooks/detail/usePdfViewer";
import { useGetAnnouncement } from "./api/get/announcement";
import { useTheme } from "../theme/hooks/useTheme";
import { useGetAnnouncementPdf } from "./api/get/pdf";
import TabSection from "./components/detail/TabSection";
import TopicSection from "./components/detail/TopicSection";
import { ACTIVE_TAB, ActiveTabType } from "./types/activeTab";
import { useCreateCondition } from "../condition/api/post/create";
import { ZoteroAnnotation } from "../annotation/types/zoteroAnnotation";

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
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>(
    {},
  );
  const [expandedContents, setExpandedContents] = useState<
    Record<string, boolean>
  >({});
  const [editedContents, setEditedContents] = useState<Record<string, string>>(
    {},
  );

  // 토픽(카테고리) 확장/축소 토글
  const handleToggleTopic = (topicId: string) => {
    setExpandedTopics((prev) => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  // 컨텐츠 확장/축소 토글
  const handleToggleContent = (topicId: string, contentIndex: number) => {
    const key = `${topicId}-${contentIndex}`;
    setExpandedContents((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 컨텐츠 편집
  const handleContentEdit = (
    topicId: string,
    content: any,
    newContent: string,
  ) => {
    const key = `${topicId}-${content.content}`;
    setEditedContents((prev) => ({ ...prev, [key]: newContent }));
  };

  // 컨텐츠 리셋
  const handleResetContent = (topicId: string, content: any) => {
    const key = `${topicId}-${content.content}`;
    setEditedContents((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  // PDF 위치 하이라이트 클릭 (annotationId 기반)
  const handleHighlightClick = (annotationId: string) => {
    if (readerRef.current && annotationId) {
      readerRef.current.setSelectedAnnotations([annotationId]);
    }
  };

  // 자유게시판 상태 관리
  const [newPost, setNewPost] = useState("");
  const [newPostAuthor, setNewPostAuthor] = useState("");
  const [commentInputs, setCommentInputs] = useState<
    Record<string, { author: string; content: string }>
  >({});

  // 메모 탭 상태: 단일 텍스트
  const [memoText, setMemoText] = useState("");

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
                // 각 카테고리별로 해당하는 annotation(하이라이트)들을 contents로 변환
                const contents = (announcementDetail.annotations || [])
                  .filter((ann) => ann.category_id === category.id)
                  .map((ann) => ({
                    id: ann.id,
                    content: ann.text,
                    bbox: ann.position,
                    comments: [],
                    color: ann.color,
                  }));
                return (
                  <TopicSection
                    key={category.id}
                    topic={{
                      id: category.id,
                      topic: category.name,
                      contents,
                    }}
                    expandedTopics={expandedTopics}
                    expandedContents={expandedContents}
                    editedContents={editedContents}
                    contentAnnotations={{}}
                    comments={{}}
                    newComment={{}}
                    onToggleTopic={handleToggleTopic}
                    onToggleContent={handleToggleContent}
                    onContentEdit={handleContentEdit}
                    onResetContent={handleResetContent}
                    onHighlightClick={handleHighlightClick}
                    onAddComment={() => {}}
                    onDeleteComment={() => {}}
                    onNewCommentChange={() => {}}
                    onAnnotationClick={() => {}}
                  />
                );
              })}
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
