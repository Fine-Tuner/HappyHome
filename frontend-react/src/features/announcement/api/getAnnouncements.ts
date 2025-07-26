import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import queryKeys from "./queryKey";
import { client } from "../../../shared/constants/baseApi";
import { Announcement, SortType } from "../types/announcement";

export interface GetAnnouncementsResponse {
  items: Announcement[];
  totalCount: number;
}

export interface GetAnnouncementsParams {
  page: number;
  limit: number;
  provinceName?: string;
  districtName?: string[];
  supplyTypeName?: string;
  houseTypeName?: string;
  beginDate?: string;
  endDate?: string;
  announcementName?: string;
  sortType?: SortType;
  announcementStatus?: string;
}

export const getAnnouncements = async (
  params?: GetAnnouncementsParams,
): Promise<GetAnnouncementsResponse> => {
  const response = await client.get("/announcements", {
    params,
  });
  return response.data;
};

export type OptionsWithoutKeyFn = Omit<
  UseQueryOptions<GetAnnouncementsResponse>,
  "queryKey" | "queryFn"
>;
interface UseGetAnnouncements {
  params?: GetAnnouncementsParams;
  options?: OptionsWithoutKeyFn;
}
export const useGetAnnouncements = ({
  params,
  options,
}: UseGetAnnouncements) => {
  return useQuery<GetAnnouncementsResponse>({
    queryKey: queryKeys.list(params),
    queryFn: ({ queryKey }) => {
      const [, params] = queryKey as [unknown, GetAnnouncementsParams];
      return getAnnouncements(params);
    },
    placeholderData: (previousData) => previousData, // 이전 데이터를 유지하면서 새 데이터 로딩
    staleTime: 30000, // 30초 동안 데이터를 fresh로 간주
    gcTime: 300000, // 5분 동안 캐시 유지
    ...options,
  });
};
