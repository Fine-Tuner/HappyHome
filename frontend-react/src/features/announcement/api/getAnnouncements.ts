import {
  useSuspenseQuery,
  UseSuspenseQueryOptions,
} from "@tanstack/react-query";
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
  UseSuspenseQueryOptions<GetAnnouncementsResponse>,
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
  return useSuspenseQuery<GetAnnouncementsResponse>({
    queryKey: queryKeys.list(params),
    queryFn: ({ queryKey }) => {
      const [, , params] = queryKey as [
        unknown,
        unknown,
        GetAnnouncementsParams,
      ];
      return getAnnouncements(params);
    },
    ...options,
  });
};
