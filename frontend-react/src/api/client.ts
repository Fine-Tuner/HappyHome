import { Announcement } from '../types/announcement';
import { AnalysisResult, AddCommentRequest, UpdateContentRequest, ContentItem } from '../types/api';

const API_BASE_URL = '/api';

export interface AnnouncementFilter {
  brtcCode?: string;
  signguCode?: string;
  targetGroup?: string[];
  houseType?: string[];
  minArea?: number;
  maxArea?: number;
  yearMtBegin?: string;
  yearMtEnd?: string;
  announcementName?: string;
}

function toQueryString(params: Record<string, any>) {
  return Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== '' && v !== '전체' && !(Array.isArray(v) && v.length === 0))
    .map(([k, v]) =>
      Array.isArray(v)
        ? v.map(item => `${encodeURIComponent(k)}=${encodeURIComponent(item)}`).join('&')
        : `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
    )
    .join('&');
}

export const api = {
  // 공고 목록 조회
  getAnnouncements: async (filters: AnnouncementFilter = {}): Promise<{ items: Announcement[]; totalCount: number }> => {
    const query = toQueryString(filters);
    const response = await fetch(`${API_BASE_URL}/announcements${query ? `?${query}` : ''}`);
    if (!response.ok) throw new Error('Failed to fetch announcements');
    return response.json();
  },

  // 공고 상세 조회
  getAnnouncement: async (id: string): Promise<Announcement> => {
    const response = await fetch(`${API_BASE_URL}/announcements/${id}`);
    if (!response.ok) throw new Error('Failed to fetch announcement');
    return response.json();
  },

  // 공고 분석 결과 조회
  getAnalysisResults: async (id: string): Promise<AnalysisResult[]> => {
    const response = await fetch(`${API_BASE_URL}/announcements/${id}/analysis`);
    if (!response.ok) throw new Error('Failed to fetch analysis results');
    return response.json();
  },

  // 댓글 추가
  addComment: async (id: string, data: AddCommentRequest): Promise<Comment> => {
    const response = await fetch(`${API_BASE_URL}/announcements/${id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to add comment');
    return response.json();
  },

  // 댓글 삭제
  deleteComment: async (id: string, commentId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/announcements/${id}/comments/${commentId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete comment');
  },

  // 내용 수정
  updateContent: async (id: string, contentId: string, data: UpdateContentRequest): Promise<ContentItem> => {
    const response = await fetch(`${API_BASE_URL}/announcements/${id}/contents/${contentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update content');
    return response.json();
  },
}; 