import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePdfViewer } from "./hooks/detail/usePdfViewer";
import { useGetAnnouncement } from "./api/get/announcement";
import { useTheme } from "../theme/hooks/useTheme";
import { useGetAnnouncementPdf } from "./api/get/pdf";

export default function AnnouncementDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("summary");

  // API 데이터 패칭
  const {
    data: announcementDetail,
    isLoading,
    isError,
    error,
  } = useGetAnnouncement({
    params: { announcement_id: params.id! },
  });

  // PDF Blob 패칭
  const pdfUrl = announcementDetail?.pdfUrl;
  const {
    data: pdfBlob,
    isLoading: isPdfLoading,
    isError: isPdfError,
  } = useGetAnnouncementPdf({
    params: { announcement_id: params.id! },
    options: { enabled: !!pdfUrl },
  });

  // PDF 카테고리 추출 (categories)
  const pdfCategories =
    announcementDetail?.categories?.map((item) => ({
      id: item.id,
      title: item.name,
    })) || [];

  // 어노테이션 저장 콜백 구현 (임시)
  const handleSaveAnnotations = (annotations: any[]) => {
    // TODO: 서버 저장 로직 구현
  };

  const {
    iframeRef,
    readerRef,
    pdfWidth,
    isDragging,
    containerRef,
    handleMouseDown,
    initializePdfViewer,
    iframeLoaded,
  } = usePdfViewer(theme, pdfCategories, handleSaveAnnotations, pdfBlob);

  // const {
  //   expandedTopics,
  //   expandedContents,
  //   editedContents,
  //   contentAnnotations,
  //   toggleTopic,
  //   toggleContent,
  //   handleContentEdit,
  //   handleResetContent,
  //   onSaveAnnotations,
  // } = useContent();

  // 자유게시판 상태 관리
  const [newPost, setNewPost] = useState("");
  const [newPostAuthor, setNewPostAuthor] = useState("");
  const [commentInputs, setCommentInputs] = useState<
    Record<string, { author: string; content: string }>
  >({});

  // 메모 탭 상태: 단일 텍스트
  const [memoText, setMemoText] = useState("");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        불러오는 중...
      </div>
    );
  }
  if (isError || !announcementDetail) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        공고 정보를 불러오는데 실패했습니다.
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

            {/* <TabSection activeTab={activeTab} onTabChange={setActiveTab}> */}
            {/* 기존 renderTabContent 함수 내 mockData 기반 부분을 announcementDetail 기반으로 리팩터링 필요 */}
            {/* </TabSection> */}
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
