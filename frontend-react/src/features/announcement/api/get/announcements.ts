import {
  useSuspenseQuery,
  UseSuspenseQueryOptions,
} from "@tanstack/react-query";
import queryKeys from "../queryKey";
import { client } from "../../../../shared/constants/baseApi";
import { Announcement } from "../../types/announcement";

// 전체 응답 타입 정의
export interface GetAnnouncementsResponse {
  items: Announcement[];
  totalCount: number;
}

export const getAnnouncements = async (): Promise<GetAnnouncementsResponse> => {
  const response = await client.get("/announcements");
  return response.data;
};

export type OptionsWithoutKeyFn = Omit<
  UseSuspenseQueryOptions<GetAnnouncementsResponse>,
  "queryKey" | "queryFn"
>;
interface Rq {
  options?: OptionsWithoutKeyFn;
}
export const useGetAnnouncements = ({ options }: Rq) => {
  return useSuspenseQuery<GetAnnouncementsResponse>({
    queryKey: queryKeys.list(),
    queryFn: getAnnouncements,
    ...options,
  });
};
