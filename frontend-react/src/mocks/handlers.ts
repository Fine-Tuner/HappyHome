import { http, HttpResponse } from "msw";
import { AddCommentRequest } from "../types/api";

// 임시 데이터
const announcements = [
  {
    sn: "1",
    announcementName: "2024년 상반기 공공임대주택 입주자 모집공고",
    address: "서울시 강남구",
    targetGroup: ["무주택자", "소득기준 충족"],
    houseType: ["아파트"],
    area: [59.97, 84.96],
    announcementDate: "2024-04-01",
    applicationStartDate: "2025-01-01",
    applicationEndDate: "2025-12-30",
    moveInDate: "2026-01-01",
    totalHouseholds: 100,
    suplyType: "행복주택",
    viewCount: 1234,
  },
  {
    sn: "2",
    announcementName:
      "2024년 하반기 공공임대주택 입주자 모집공고입니다아아아아아 이것은 긴 공고명입니다아아아",
    address: "서울시 서초구",
    targetGroup: ["무주택자", "소득기준 충족", "대학생"],
    houseType: ["연립주택"],
    area: [59.97, 84.96],
    announcementDate: "2025-01-01",
    applicationStartDate: "2026-05-01",
    applicationEndDate: "2026-12-30",
    moveInDate: "2027-01-01",
    totalHouseholds: 150,
    suplyType: "국민임대",
    viewCount: 567,
  },
  {
    sn: "3",
    name: "2024년 1분기 공공임대주택 입주자 모집공고",
    address: "서울시 송파구",
    announcementDate: "2024-03-01",
    applicationStartDate: "2024-03-15",
    applicationEndDate: "2024-03-31",
    moveInDate: "2024-06-01",
    totalHouseholds: 80,
    remainingHouseholds: 60,
    conditions: ["무주택자", "소득기준 충족"],
    pdfUrl: "/공고문_17779_20250405_135700.pdf",
    suplyType: "행복주택",
    houseType: "아파트",
    viewCount: 890,
  },
  {
    sn: "4",
    name: "2024년 2분기 공공임대주택 입주자 모집공고",
    address: "서울시 마포구",
    announcementDate: "2024-06-01",
    applicationStartDate: "2024-06-15",
    applicationEndDate: "2024-06-30",
    moveInDate: "2024-09-01",
    totalHouseholds: 120,
    remainingHouseholds: 100,
    conditions: ["무주택자", "소득기준 충족"],
    pdfUrl: "/공고문_17779_20250405_135700.pdf",
    suplyType: "국민임대",
    houseType: "아파트",
    viewCount: 756,
  },
  {
    sn: "5",
    name: "2024년 3분기 공공임대주택 입주자 모집공고",
    address: "서울시 용산구",
    announcementDate: "2024-07-01",
    applicationStartDate: "2024-07-15",
    applicationEndDate: "2024-07-31",
    moveInDate: "2024-10-01",
    totalHouseholds: 90,
    remainingHouseholds: 70,
    conditions: ["무주택자", "소득기준 충족"],
    pdfUrl: "/공고문_17779_20250405_135700.pdf",
    suplyType: "행복주택",
    houseType: "연립주택",
    viewCount: 678,
  },
  {
    sn: "6",
    name: "2024년 4분기 공공임대주택 입주자 모집공고",
    address: "서울시 중구",
    announcementDate: "2024-08-01",
    applicationStartDate: "2024-08-15",
    applicationEndDate: "2024-08-31",
    moveInDate: "2024-11-01",
    totalHouseholds: 110,
    remainingHouseholds: 90,
    conditions: ["무주택자", "소득기준 충족"],
    pdfUrl: "/공고문_17779_20250405_135700.pdf",
    suplyType: "국민임대",
    houseType: "아파트",
    viewCount: 543,
  },
  {
    sn: "7",
    name: "2024년 1분기 공공임대주택 입주자 모집공고",
    address: "서울시 종로구",
    announcementDate: "2024-09-01",
    applicationStartDate: "2024-09-15",
    applicationEndDate: "2024-09-30",
    moveInDate: "2024-12-01",
    totalHouseholds: 70,
    remainingHouseholds: 50,
    conditions: ["무주택자", "소득기준 충족"],
    pdfUrl: "/공고문_17779_20250405_135700.pdf",
    suplyType: "행복주택",
    houseType: "연립주택",
    viewCount: 432,
  },
  {
    sn: "8",
    name: "2024년 2분기 공공임대주택 입주자 모집공고",
    address: "서울시 동작구",
    announcementDate: "2024-10-01",
    applicationStartDate: "2024-10-15",
    applicationEndDate: "2024-10-31",
    moveInDate: "2025-01-01",
    totalHouseholds: 130,
    remainingHouseholds: 110,
    conditions: ["무주택자", "소득기준 충족"],
    pdfUrl: "/공고문_17779_20250405_135700.pdf",
    suplyType: "국민임대",
    houseType: "아파트",
    viewCount: 345,
  },
  {
    sn: "9",
    name: "2024년 3분기 공공임대주택 입주자 모집공고",
    address: "서울시 영등포구",
    announcementDate: "2024-11-01",
    applicationStartDate: "2024-11-15",
    applicationEndDate: "2024-11-30",
    moveInDate: "2025-02-01",
    totalHouseholds: 95,
    remainingHouseholds: 75,
    conditions: ["무주택자", "소득기준 충족"],
    pdfUrl: "/공고문_17779_20250405_135700.pdf",
    suplyType: "행복주택",
    houseType: "연립주택",
    viewCount: 234,
  },
  {
    sn: "10",
    name: "2024년 4분기 공공임대주택 입주자 모집공고",
    address: "서울시 구로구",
    announcementDate: "2024-12-01",
    applicationStartDate: "2024-12-15",
    applicationEndDate: "2024-12-31",
    moveInDate: "2025-03-01",
    totalHouseholds: 105,
    remainingHouseholds: 85,
    conditions: ["무주택자", "소득기준 충족"],
    pdfUrl: "/공고문_17779_20250405_135700.pdf",
    suplyType: "국민임대",
    houseType: "아파트",
    viewCount: 123,
  },
  {
    sn: "11",
    name: "2024년 1분기 공공임대주택 입주자 모집공고",
    address: "서울시 금천구",
    announcementDate: "2025-01-01",
    applicationStartDate: "2025-01-15",
    applicationEndDate: "2025-01-31",
    moveInDate: "2025-04-01",
    totalHouseholds: 85,
    remainingHouseholds: 65,
    conditions: ["무주택자", "소득기준 충족"],
    pdfUrl: "/공고문_17779_20250405_135700.pdf",
    suplyType: "행복주택",
    houseType: "연립주택",
    viewCount: 456,
  },
  {
    sn: "12",
    name: "2024년 2분기 공공임대주택 입주자 모집공고",
    address: "서울시 노원구",
    announcementDate: "2025-02-01",
    applicationStartDate: "2025-02-15",
    applicationEndDate: "2025-02-28",
    moveInDate: "2025-05-01",
    totalHouseholds: 115,
    remainingHouseholds: 95,
    conditions: ["무주택자", "소득기준 충족"],
    pdfUrl: "/공고문_17779_20250405_135700.pdf",
    suplyType: "국민임대",
    houseType: "아파트",
    viewCount: 567,
  },
  {
    sn: "13",
    name: "2024년 3분기 공공임대주택 입주자 모집공고",
    address: "서울시 도봉구",
    announcementDate: "2025-03-01",
    applicationStartDate: "2025-03-15",
    applicationEndDate: "2025-03-31",
    moveInDate: "2025-06-01",
    totalHouseholds: 75,
    remainingHouseholds: 55,
    conditions: ["무주택자", "소득기준 충족"],
    pdfUrl: "/공고문_17779_20250405_135700.pdf",
    suplyType: "행복주택",
    houseType: "연립주택",
    viewCount: 678,
  },
  {
    sn: "14",
    name: "2024년 4분기 공공임대주택 입주자 모집공고",
    address: "서울시 강북구",
    announcementDate: "2025-04-01",
    applicationStartDate: "2025-04-15",
    applicationEndDate: "2025-04-30",
    moveInDate: "2025-07-01",
    totalHouseholds: 125,
    remainingHouseholds: 105,
    conditions: ["무주택자", "소득기준 충족"],
    pdfUrl: "/공고문_17779_20250405_135700.pdf",
    suplyType: "국민임대",
    houseType: "아파트",
    viewCount: 789,
  },
  {
    sn: "15",
    name: "2024년 1분기 공공임대주택 입주자 모집공고",
    address: "서울시 강동구",
    announcementDate: "2025-05-01",
    applicationStartDate: "2025-05-15",
    applicationEndDate: "2025-05-31",
    moveInDate: "2025-08-01",
    totalHouseholds: 90,
    remainingHouseholds: 70,
    conditions: ["무주택자", "소득기준 충족"],
    pdfUrl: "/공고문_17779_20250405_135700.pdf",
    suplyType: "행복주택",
    houseType: "연립주택",
    viewCount: 890,
  },
  {
    sn: "16",
    name: "2024년 2분기 공공임대주택 입주자 모집공고",
    address: "서울시 광진구",
    announcementDate: "2025-06-01",
    applicationStartDate: "2025-06-15",
    applicationEndDate: "2025-06-30",
    moveInDate: "2025-09-01",
    totalHouseholds: 140,
    remainingHouseholds: 120,
    conditions: ["무주택자", "소득기준 충족"],
    pdfUrl: "/공고문_17779_20250405_135700.pdf",
    suplyType: "국민임대",
    houseType: "아파트",
    viewCount: 901,
  },
  {
    sn: "17",
    name: "2024년 3분기 공공임대주택 입주자 모집공고",
    address: "서울시 서대문구",
    announcementDate: "2025-07-01",
    applicationStartDate: "2025-07-15",
    applicationEndDate: "2025-07-31",
    moveInDate: "2025-10-01",
    totalHouseholds: 80,
    remainingHouseholds: 60,
    conditions: ["무주택자", "소득기준 충족"],
    pdfUrl: "/공고문_17779_20250405_135700.pdf",
    suplyType: "행복주택",
    houseType: "연립주택",
    viewCount: 234,
  },
  {
    sn: "18",
    name: "2024년 4분기 공공임대주택 입주자 모집공고",
    address: "서울시 성북구",
    announcementDate: "2025-08-01",
    applicationStartDate: "2025-08-15",
    applicationEndDate: "2025-08-31",
    moveInDate: "2025-11-01",
    totalHouseholds: 100,
    remainingHouseholds: 80,
    conditions: ["무주택자", "소득기준 충족"],
    pdfUrl: "/공고문_17779_20250405_135700.pdf",
    suplyType: "국민임대",
    houseType: "아파트",
    viewCount: 345,
  },
  {
    sn: "19",
    name: "2024년 1분기 공공임대주택 입주자 모집공고",
    address: "서울시 중랑구",
    announcementDate: "2025-09-01",
    applicationStartDate: "2025-09-15",
    applicationEndDate: "2025-09-30",
    moveInDate: "2025-12-01",
    totalHouseholds: 85,
    remainingHouseholds: 65,
    conditions: ["무주택자", "소득기준 충족"],
    pdfUrl: "/공고문_17779_20250405_135700.pdf",
    suplyType: "행복주택",
    houseType: "연립주택",
    viewCount: 456,
  },
  {
    sn: "20",
    name: "2024년 2분기 공공임대주택 입주자 모집공고",
    address: "서울시 동대문구",
    announcementDate: "2025-10-01",
    applicationStartDate: "2025-10-15",
    applicationEndDate: "2025-10-31",
    moveInDate: "2026-01-01",
    totalHouseholds: 120,
    remainingHouseholds: 100,
    conditions: ["무주택자", "소득기준 충족"],
    pdfUrl: "/공고문_17779_20250405_135700.pdf",
    suplyType: "국민임대",
    houseType: "아파트",
    viewCount: 567,
  },
];

const analysisResults = [
  {
    id: "1",
    topic: "신청자격",
    contents: [
      {
        content: "무주택자로서 소득기준을 충족하는 자",
        bbox: { x: 26.444, y: 38.221, width: 570.002, height: 813.086 },
        comments: [
          {
            id: "c1",
            content: "소득기준이 어떻게 되나요?",
            createdAt: "2024-04-15T10:00:00Z",
            author: "홍길동",
          },
          {
            id: "c2",
            content: "소득기준은 4인 가구 기준 5,000만원 이하입니다.",
            createdAt: "2024-04-15T11:00:00Z",
            author: "관리자",
          },
        ],
      },
    ],
  },
];

// 댓글 저장소
const comments: Record<string, any[]> = {};

export const handlers = [
  // 공고 목록 조회
  http.get("/api/announcements", ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "12");
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    const result = {
      items: announcements.slice(start, end),
      totalCount: announcements.length,
    };
    return HttpResponse.json(result);
  }),

  // 공고 상세 조회
  http.get("/api/announcements/:sn", ({ params }) => {
    const announcement = announcements.find((a) => a.sn === params.sn);
    if (!announcement) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(announcement);
  }),

  // 공고 분석 결과 조회
  http.get("/api/announcements/:sn/analysis", ({ params }) => {
    return HttpResponse.json(analysisResults);
  }),

  // 댓글 추가
  http.post("/api/announcements/:sn/comments", async ({ request }) => {
    const body = (await request.json()) as AddCommentRequest;
    const newComment = {
      id: `c${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
    };

    const contentId = body.contentId;
    if (!comments[contentId]) {
      comments[contentId] = [];
    }
    comments[contentId].push(newComment);

    return HttpResponse.json(newComment);
  }),

  // 댓글 삭제
  http.delete("/api/announcements/:sn/comments/:commentId", ({ params }) => {
    const { commentId } = params;
    let deleted = false;

    Object.keys(comments).forEach((contentId) => {
      const index = comments[contentId].findIndex((c) => c.id === commentId);
      if (index !== -1) {
        comments[contentId].splice(index, 1);
        deleted = true;
      }
    });

    if (!deleted) {
      return new HttpResponse(null, { status: 404 });
    }

    return new HttpResponse(null, { status: 204 });
  }),

  // 내용 수정
  http.patch(
    "/api/announcements/:sn/contents/:contentId",
    async ({ request }) => {
      const body = await request.json();
      return HttpResponse.json(body);
    },
  ),
];
