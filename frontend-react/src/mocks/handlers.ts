import { http, HttpResponse } from 'msw';

// 임시 데이터
const announcements = [
  {
    id: '1',
    name: '2024년 상반기 공공임대주택 입주자 모집공고',
    address: '서울시 강남구',
    announcementDate: '2024-04-01',
    applicationStartDate: '2024-04-15',
    applicationEndDate: '2024-04-30',
    moveInDate: '2024-07-01',
    totalHouseholds: 100,
    remainingHouseholds: 80,
    conditions: ['무주택자', '소득기준 충족'],
    pdfUrl: '/공고문_17779_20250405_135700.pdf'
  },
  {
    id: '2',
    name: '2024년 하반기 공공임대주택 입주자 모집공고',
    address: '서울시 서초구',
    announcementDate: '2024-05-01',
    applicationStartDate: '2024-05-15',
    applicationEndDate: '2024-05-30',
    moveInDate: '2024-08-01',
    totalHouseholds: 150,
    remainingHouseholds: 150,
    conditions: ['무주택자', '소득기준 충족'],
    pdfUrl: '/공고문_17779_20250405_135700.pdf'
  }
];

const analysisResults = [
  {
    id: '1',
    topic: '신청자격',
    contents: [
      {
        content: '무주택자로서 소득기준을 충족하는 자',
        bbox: { x: 26.444, y: 38.221, width: 570.002, height: 813.086 },
        comments: [
          {
            id: 'c1',
            content: '소득기준이 어떻게 되나요?',
            createdAt: '2024-04-15T10:00:00Z',
            author: '홍길동'
          },
          {
            id: 'c2',
            content: '소득기준은 4인 가구 기준 5,000만원 이하입니다.',
            createdAt: '2024-04-15T11:00:00Z',
            author: '관리자'
          }
        ]
      }
    ]
  }
];

export const handlers = [
  // 공고 목록 조회
  http.get('/api/announcements', () => {
    return HttpResponse.json(announcements);
  }),

  // 공고 상세 조회
  http.get('/api/announcements/:id', ({ params }) => {
    const announcement = announcements.find(a => a.id === params.id);
    if (!announcement) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(announcement);
  }),

  // 공고 분석 결과 조회
  http.get('/api/announcements/:id/analysis', ({ params }) => {
    return HttpResponse.json(analysisResults);
  }),

  // 댓글 추가
  http.post('/api/announcements/:id/comments', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: `c${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString()
    });
  }),

  // 댓글 삭제
  http.delete('/api/announcements/:id/comments/:commentId', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // 내용 수정
  http.patch('/api/announcements/:id/contents/:contentId', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(body);
  })
]; 