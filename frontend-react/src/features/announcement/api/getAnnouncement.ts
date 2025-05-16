import { client } from "../../../shared/constants/baseApi";
import {
  useSuspenseQuery,
  UseSuspenseQueryOptions,
} from "@tanstack/react-query";
import queryKeys from "./queryKey";

export interface AnnotationPosition {
  pageIndex: number;
  rects: number[];
}

export interface Annotation {
  authorName: string;
  color: string;
  comment: string;
  dateCreated: string;
  dateModified: string;
  id: string;
  original_id: string;
  category_id: string;
  isAuthorNameAuthoritative: boolean;
  pageLabel: string;
  position: AnnotationPosition;
  sortIndex: string;
  tags: string[];
  text: string;
  type: "highlight";
}

export interface Category {
  id: string;
  name: string;
  comment: string;
}

export interface GetAnnouncementResponse {
  annotations: Annotation[];
  categories: Category[];
  pdfUrl: string;
  viewCount: number;
}

export interface GetAnnouncementParams {
  announcementId: string;
  userId?: string;
}

export const getAnnouncement = async ({
  announcementId,
  userId,
}: GetAnnouncementParams): Promise<GetAnnouncementResponse> => {
  const response = await client.get(`/announcements/${announcementId}`, {
    params: userId ? { userId } : undefined,
  });
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
    queryKey: queryKeys.detail(params),
    queryFn: ({ queryKey }) => {
      const [, , params] = queryKey as [
        unknown,
        unknown,
        GetAnnouncementParams,
      ];
      return getAnnouncement(params);
    },
    ...options,
  });
};
