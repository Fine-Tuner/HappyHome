import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TopicSection from "./components/detail/TopicSection";
import TabSection from "./components/detail/TabSection";

export default function AnnouncementDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState("summary");

  // Topic 관리를 위한 상태
  const [topics, setTopics] = useState<AnalysisResult[]>(mockAnalysisResults);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [isAddingTopic, setIsAddingTopic] = useState(false);

  // usePdfViewer 훅 사용 시 contents 리스트 생성 (Topic 제목만)
  const pdfCategories = topics.map((item) => ({
    id: item.id,
    title: item.topic,
  }));

  // 어노테이션 저장 콜백 구현
  const handleSaveAnnotations = (annotations: any[]) => {
    setTopics((prevTopics) =>
      prevTopics.map((topic) => {
        // contentId가 Topic의 id와 일치하는 어노테이션만 추출
        const newAnnotations = annotations.filter(
          (a) => a.contentId === topic.id,
        );
        if (newAnnotations.length > 0) {
          // 어노테이션을 Content 형태로 변환 (color 포함)
          const newContents = newAnnotations.map((a) => ({
            content: a.text, // 어노테이션 본문
            bbox: a.position, // 어노테이션 위치 정보
            color: a.color, // 어노테이션 색상
            comments: [],
          }));
          return {
            ...topic,
            contents: [...topic.contents, ...newContents],
          };
        }
        return topic;
      }),
    );
  };

  const {
    iframeRef,
    readerRef,
    pdfWidth,
    isDragging,
    containerRef,
    handleMouseDown,
    iframeLoaded,
  } = usePdfViewer(theme, pdfCategories, handleSaveAnnotations);

  const { comments, newComment, setNewComment, handleDeleteComment } =
    useComments(params.sn!);

  const {
    expandedTopics,
    expandedContents,
    editedContents,
    contentAnnotations,
    toggleTopic,
    toggleContent,
    handleContentEdit,
    handleResetContent,
    onSaveAnnotations,
  } = useContent();

  // 자유게시판 상태 관리
  const [postList, setPostList] = useState(mockPosts);
  const [newPost, setNewPost] = useState("");
  const [newPostAuthor, setNewPostAuthor] = useState("");
  const [commentInputs, setCommentInputs] = useState<
    Record<string, { author: string; content: string }>
  >({});

  // 메모 탭 상태: 단일 텍스트
  const [memoText, setMemoText] = useState("");

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchAnnouncementData = async () => {
      try {
        const [announcementData, analysisData] = await Promise.all([
          api.getAnnouncement(params.sn!),
          api.getAnalysisResults(params.sn!),
        ]);

        setAnnouncement(announcementData);
        setAnalysisResults(analysisData);
      } catch (err) {
        setError("공고 정보를 불러오는데 실패했습니다.");
        console.error("Error fetching announcement data:", err);
      }
    };

    if (params.sn) {
      fetchAnnouncementData();
    }
  }, [params.sn]);

  // Topic 추가 함수
  const handleAddTopic = () => {
    if (newTopicTitle.trim() === "") return;

    const newTopic: AnalysisResult = {
      id: `topic-${Date.now()}`,
      topic: newTopicTitle.trim(),
      contents: [
        {
          content: "내용을 입력하세요",
          bbox: { x: 0, y: 0, width: 0, height: 0 },
          comments: [],
        },
      ],
    };

    setTopics((prev) => [...prev, newTopic]);
    setNewTopicTitle("");
    setIsAddingTopic(false);

    // 새로 추가된 토픽 자동 펼치기
    toggleTopic(newTopic.id);
  };

  // Topic 삭제 함수
  const handleDeleteTopic = (topicId: string) => {
    setTopics((prev) => prev.filter((topic) => topic.id !== topicId));
  };

  // Content 추가 함수
  const handleAddContent = (topicId: string) => {
    const newContent: ContentItem = {
      content: "새 내용을 입력하세요",
      bbox: { x: 0, y: 0, width: 0, height: 0 },
      comments: [],
    };

    setTopics((prev) =>
      prev.map((topic) => {
        if (topic.id === topicId) {
          return {
            ...topic,
            contents: [...topic.contents, newContent],
          };
        }
        return topic;
      }),
    );
  };

  // Topic 제목 수정 함수
  const handleEditTopicTitle = (topicId: string, newTitle: string) => {
    if (newTitle.trim() === "") return;

    setTopics((prev) =>
      prev.map((topic) => {
        if (topic.id === topicId) {
          return {
            ...topic,
            topic: newTitle.trim(),
          };
        }
        return topic;
      }),
    );
  };

  // Content 삭제 함수
  const handleDeleteContent = (topicId: string, contentIndex: number) => {
    // contentIndex가 -1이면 새 컨텐츠를 추가
    if (contentIndex === -1) {
      handleAddContent(topicId);
      return;
    }

    // 기존 삭제 로직
    setTopics((prev) =>
      prev.map((topic) => {
        if (topic.id === topicId) {
          const newContents = [...topic.contents];
          newContents.splice(contentIndex, 1);

          // 최소 1개의 content는 유지
          if (newContents.length === 0) {
            newContents.push({
              content: "내용을 입력하세요",
              bbox: { x: 0, y: 0, width: 0, height: 0 },
              comments: [],
            });
          }

          return {
            ...topic,
            contents: newContents,
          };
        }
        return topic;
      }),
    );
  };

  const handleHighlightClick = (bbox: any) => {
    // bbox: { pageIndex, rects: [[x1, y1, x2, y2], ...] }
    const innerFrame =
      iframeRef.current?.contentWindow?.document?.querySelector("iframe");
    if (!innerFrame) return;
    const innerFrameWindow = innerFrame.contentWindow;

    // PDF 페이지 찾기
    const pageNumber = (bbox.pageIndex ?? 0) + 1;
    const pageElement = innerFrameWindow?.document?.querySelector(
      `.page[data-page-number="${pageNumber}"]`,
    );
    if (!pageElement) return;

    // 하이라이트 레이어 생성 부분 제거, 스크롤만 수행
    if ((bbox.rects || []).length > 0) {
      pageElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // 게시물 등록 함수
  const handleAddPost = () => {
    if (!newPost.trim() || !newPostAuthor.trim()) return;
    setPostList((prev) => [
      {
        id: `p${Date.now()}`,
        author: newPostAuthor,
        content: newPost,
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: [],
      },
      ...prev,
    ]);
    setNewPost("");
    setNewPostAuthor("");
  };

  // 댓글 등록 함수
  const handleAddComment = (postId: string) => {
    const input = commentInputs[postId];
    if (!input || !input.author.trim() || !input.content.trim()) return;
    setPostList((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [
                ...post.comments,
                {
                  id: `c${Date.now()}`,
                  author: input.author,
                  content: input.content,
                  createdAt: new Date().toISOString(),
                  likes: 0,
                },
              ],
            }
          : post,
      ),
    );
    setCommentInputs((prev) => ({
      ...prev,
      [postId]: { author: "", content: "" },
    }));
  };

  // 따봉(좋아요) 증가 함수
  const handleLikePost = (postId: string) => {
    setPostList((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, likes: (post.likes || 0) + 1 } : post,
      ),
    );
  };

  // 댓글 좋아요 함수
  const handleLikeComment = (postId: string, commentId: string) => {
    setPostList((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: post.comments.map((c) =>
                c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c,
              ),
            }
          : post,
      ),
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "summary":
        return (
          <div className="space-y-4">
            {/* 토픽 목록 */}
            {topics.map((topic) => (
              <div key={topic.id} className="relative">
                <TopicSection
                  topic={topic}
                  expandedTopics={expandedTopics}
                  expandedContents={expandedContents}
                  editedContents={editedContents}
                  contentAnnotations={contentAnnotations}
                  comments={comments}
                  newComment={newComment}
                  onToggleTopic={toggleTopic}
                  onToggleContent={toggleContent}
                  onContentEdit={handleContentEdit}
                  onResetContent={handleResetContent}
                  onHighlightClick={handleHighlightClick}
                  onAddComment={handleAddComment}
                  onDeleteComment={handleDeleteComment}
                  onNewCommentChange={(topicId, content, value) =>
                    setNewComment((prev) => ({
                      ...prev,
                      [`${topicId}-${content}`]: value,
                    }))
                  }
                  onAnnotationClick={(annotationId) => {
                    readerRef.current?.setSelectedAnnotations([annotationId]);
                  }}
                  onDeleteContent={handleDeleteContent}
                  onDeleteTopic={handleDeleteTopic}
                  onEditTopicTitle={handleEditTopicTitle}
                />
              </div>
            ))}

            {/* 새 주제 추가하기 버튼 - 목록 아래에 배치 */}
            <div className="mt-4">
              {isAddingTopic ? (
                <div className="flex gap-2 items-center bg-gray-800/60 p-2 rounded-lg">
                  <input
                    type="text"
                    value={newTopicTitle}
                    onChange={(e) => setNewTopicTitle(e.target.value)}
                    placeholder="주제 제목을 입력하세요"
                    className="flex-1 px-2 py-1 text-sm rounded bg-gray-700 border border-gray-600 text-white"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddTopic();
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleAddTopic}
                    className="px-3 py-1 text-xs font-medium bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    추가
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingTopic(false);
                      setNewTopicTitle("");
                    }}
                    className="px-3 py-1 text-xs font-medium bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingTopic(true)}
                  className="flex items-center justify-center gap-1 py-2 px-3 text-sm font-medium text-blue-700 dark:text-blue-200 bg-blue-100 dark:bg-blue-600/30 border border-blue-200 dark:border-blue-500/30 rounded-md hover:bg-blue-200 dark:hover:bg-blue-600/40 transition-colors w-full"
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
                  새 주제 추가하기
                </button>
              )}
            </div>
          </div>
        );
      case "qa":
        return (
          <div className="space-y-6">
            {/* 게시물 작성 폼 */}
            <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPostAuthor}
                  onChange={(e) => setNewPostAuthor(e.target.value)}
                  placeholder="작성자명"
                  className="w-32 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <input
                  type="text"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="게시글을 입력하세요"
                  className="flex-1 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddPost();
                  }}
                />
                <button
                  onClick={handleAddPost}
                  className="px-4 py-1 text-sm font-semibold rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  게시글 등록
                </button>
              </div>
            </div>
            {/* 게시물 리스트 */}
            {[...postList]
              .sort((a, b) => (b.likes || 0) - (a.likes || 0))
              .map((post) => (
                <div
                  key={post.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base font-semibold text-gray-900 dark:text-white">
                      {post.author}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                    {/* 따봉(좋아요) 버튼 및 개수 */}
                    <button
                      onClick={() => handleLikePost(post.id)}
                      className="ml-2 flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800 transition"
                      title="따봉"
                    >
                      <svg
                        width="16"
                        height="16"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      <span>{post.likes || 0}</span>
                    </button>
                  </div>
                  <div className="mb-3 text-gray-800 dark:text-gray-100 text-base">
                    {post.content}
                  </div>
                  {/* 댓글 리스트 */}
                  <div className="space-y-2 mb-2">
                    {post.comments.length > 0 ? (
                      post.comments.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center gap-2 pl-2 border-l-2 border-blue-200 dark:border-blue-700"
                        >
                          <span className="text-xs font-semibold text-blue-700 dark:text-blue-200">
                            {c.author}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(c.createdAt).toLocaleDateString("ko-KR")}
                          </span>
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-200">
                            {c.content}
                          </span>
                          <button
                            onClick={() => handleLikeComment(post.id, c.id)}
                            className="flex items-center gap-1 px-1 py-0.5 text-xs rounded bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-200 hover:bg-pink-200 dark:hover:bg-pink-800 transition ml-2"
                            title="댓글 좋아요"
                          >
                            <svg
                              width="14"
                              height="14"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                            <span>{c.likes || 0}</span>
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-400 italic pl-2">
                        아직 댓글이 없습니다.
                      </div>
                    )}
                  </div>
                  {/* 댓글 입력 폼 */}
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={commentInputs[post.id]?.author || ""}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({
                          ...prev,
                          [post.id]: {
                            ...prev[post.id],
                            author: e.target.value,
                          },
                        }))
                      }
                      placeholder="댓글 작성자명"
                      className="w-32 px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={commentInputs[post.id]?.content || ""}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({
                          ...prev,
                          [post.id]: {
                            ...prev[post.id],
                            content: e.target.value,
                          },
                        }))
                      }
                      placeholder="댓글을 입력하세요"
                      className="flex-1 px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddComment(post.id);
                      }}
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      className="px-3 py-1 text-xs font-semibold rounded bg-green-600 text-white hover:bg-green-700"
                    >
                      댓글 등록
                    </button>
                  </div>
                </div>
              ))}
          </div>
        );
      case "memo":
        return (
          <div className="p-4">
            <textarea
              value={memoText}
              onChange={(e) => setMemoText(e.target.value)}
              placeholder="자유롭게 메모를 남겨보세요"
              className="w-full min-h-[300px] max-h-[600px] p-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-base resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

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
              {renderTabContent()}
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

// Mock 데이터
// const mockAnalysisResults: AnalysisResult[] = [
//   {
//     id: "1",
//     topic: "신청자격",
//     contents: [
//       {
//         content:
//           "무주택자로서 소득기준을 충족하는 자 무주택자로서 소득기준을 충족하는 자 무주택자로서 소득기준을 충족하는 자 무주택자로서 소득기준을 충족하는 자 무주택자로서 소득기준을 충족하는 자 무주택자로서 소득기준을 충족하는 자",
//         bbox: { x: 26.444, y: 38.221, width: 570.002, height: 813.086 },
//         comments: [
//           {
//             id: "c1",
//             content: "소득기준이 어떻게 되나요?",
//             createdAt: "2024-04-15T10:00:00Z",
//             author: "홍길동",
//           },
//           {
//             id: "c2",
//             content: "소득기준은 4인 가구 기준 5,000만원 이하입니다.",
//             createdAt: "2024-04-15T11:00:00Z",
//             author: "관리자",
//           },
//         ],
//       },
//       {
//         content: "신청일 현재 무주택자로서 주택을 소유하지 않은 자",
//         bbox: { x: 26.444, y: 38.221, width: 570.002, height: 813.086 },
//         comments: [],
//       },
//     ],
//   },
//   {
//     id: "2",
//     topic: "임대기간",
//     contents: [
//       {
//         content: "최초 2년, 연장 가능 (최대 4년)",
//         bbox: { x: 26.444, y: 38.221, width: 570.002, height: 813.086 },
//         comments: [
//           {
//             id: "c3",
//             content: "연장 신청은 언제 해야 하나요?",
//             createdAt: "2024-04-16T09:00:00Z",
//             author: "김철수",
//           },
//         ],
//       },
//       {
//         content: "연장 시 최대 2회까지 가능하며, 1회당 1년씩 연장",
//         bbox: { x: 26.444, y: 38.221, width: 570.002, height: 813.086 },
//         comments: [],
//       },
//     ],
//   },
//   {
//     id: "3",
//     topic: "입주자 선정방법",
//     contents: [
//       {
//         content: "추첨을 통한 선정 (다자녀 가구 우선)",
//         bbox: { x: 26.444, y: 38.221, width: 570.002, height: 813.086 },
//         comments: [],
//       },
//       {
//         content: "다자녀 가구는 3자녀 이상 가구를 말하며, 우선 선정",
//         bbox: { x: 26.444, y: 38.221, width: 570.002, height: 813.086 },
//         comments: [],
//       },
//     ],
//   },
// ];

// 자유게시판 mock 데이터
// const mockPosts = [
//   {
//     id: "p1",
//     author: "이영희",
//     content: "행복주택 신청하신 분 계신가요? 후기 궁금합니다!",
//     createdAt: "2024-05-01T10:00:00Z",
//     likes: 3,
//     comments: [
//       {
//         id: "c1",
//         author: "박철수",
//         content: "저 신청했어요! 생각보다 절차가 간단했어요.",
//         createdAt: "2024-05-01T11:00:00Z",
//         likes: 0,
//       },
//       {
//         id: "c2",
//         author: "최민수",
//         content: "저도 신청했는데, 결과 기다리는 중입니다.",
//         createdAt: "2024-05-01T12:00:00Z",
//         likes: 0,
//       },
//     ],
//   },
//   {
//     id: "p2",
//     author: "김지은",
//     content: "임대 기간 연장 관련해서 정보 아시는 분 있나요?",
//     createdAt: "2024-05-02T09:30:00Z",
//     likes: 1,
//     comments: [],
//   },
//   {
//     id: "p3",
//     author: "최민수",
//     content: "추첨 일정이 언제인지 아시는 분?",
//     createdAt: "2024-05-03T14:20:00Z",
//     likes: 2,
//     comments: [
//       {
//         id: "c3",
//         author: "이영희",
//         content: "공고문에 곧 안내된다고 들었어요.",
//         createdAt: "2024-05-03T16:00:00Z",
//         likes: 0,
//       },
//     ],
//   },
// ];
