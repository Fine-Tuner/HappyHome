import axios from "axios";
import { Announcement } from "../types/announcement";
import {
  AnalysisResult,
  AddCommentRequest,
  UpdateContentRequest,
  ContentItem,
} from "../types/api";

const API_BASE_URL = "/api";

// axios 인스턴스 생성
export const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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
    .filter(
      ([_, v]) =>
        v !== undefined &&
        v !== "" &&
        v !== "전체" &&
        !(Array.isArray(v) && v.length === 0),
    )
    .map(([k, v]) =>
      Array.isArray(v)
        ? v
            .map(
              (item) => `${encodeURIComponent(k)}=${encodeURIComponent(item)}`,
            )
            .join("&")
        : `${encodeURIComponent(k)}=${encodeURIComponent(v)}`,
    )
    .join("&");
}

export const api = {
  // 공고 목록 조회
  getAnnouncements: async (
    filters: AnnouncementFilter = {},
  ): Promise<{ items: Announcement[]; totalCount: number }> => {
    const query = toQueryString(filters);
    const response = await client.get(
      `/announcements${query ? `?${query}` : ""}`,
    );
    return response.data;
  },

  // 공고 상세 조회
  getAnnouncement: async (sn: string): Promise<Announcement> => {
    const response = await client.get(`/announcements/${sn}`);
    return response.data;
  },

  // 공고 분석 결과 조회
  getAnalysisResults: async (sn: string): Promise<AnalysisResult[]> => {
    const response = await client.get(`/announcements/${sn}/analysis`);
    return response.data;
  },

  // 댓글 추가
  addComment: async (sn: string, data: AddCommentRequest): Promise<Comment> => {
    const response = await client.post(`/announcements/${sn}/comments`, data);
    return response.data;
  },

  // 댓글 삭제
  deleteComment: async (sn: string, commentId: string): Promise<void> => {
    await client.delete(`/announcements/${sn}/comments/${commentId}`);
  },

  // 내용 수정
  updateContent: async (
    sn: string,
    contentId: string,
    data: UpdateContentRequest,
  ): Promise<ContentItem> => {
    const response = await client.patch(
      `/announcements/${sn}/contents/${contentId}`,
      data,
    );
    return response.data;
  },
};
