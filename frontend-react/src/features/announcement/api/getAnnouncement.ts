import { client } from "../../../shared/constants/baseApi";
import {
  useSuspenseQuery,
  UseSuspenseQueryOptions,
} from "@tanstack/react-query";
import queryKeys from "./queryKey";

export interface Condition {
  id: string;
  original_id?: string;
  category_id?: string;
  user_id?: string;
  text: string;
  comment?: string;
  color?: string;
  dateCreated: string;
  dateModified: string;
  pageLabel: string;
  position: object;
  is_deleted: boolean;
  tags: string[];
  authorName: string;
  isAuthorNameAuthoritative: boolean;
  sortIndex?: string;
  type: string;
}

export interface Category {
  id: string;
  original_id?: string;
  user_id?: string;
  name: string;
  comment?: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface GetAnnouncementResponse {
  conditions: Condition[];
  categories: Category[];
  pdfUrl: string;
  viewCount: number;
}

export interface GetAnnouncementParams {
  announcementId: string;
}

export const getAnnouncement = async (
  announcementId: string,
): Promise<GetAnnouncementResponse> => {
  const response = await client.get(`/announcements/${announcementId}`);
  return response.data;
};

export type OptionsWithoutKeyFn = Omit<
  UseSuspenseQueryOptions<GetAnnouncementResponse>,
  "queryKey" | "queryFn"
>;

interface UseGetAnnouncement {
  params: GetAnnouncementParams;
  options?: OptionsWithoutKeyFn;
}

export const useGetAnnouncement = ({ params, options }: UseGetAnnouncement) => {
  return useSuspenseQuery<GetAnnouncementResponse>({
    queryKey: queryKeys.detail(params.announcementId),
    queryFn: ({ queryKey }) => {
      const [, announcementId] = queryKey as [unknown, string];
      return getAnnouncement(announcementId);
    },
    ...options,
  });
};
