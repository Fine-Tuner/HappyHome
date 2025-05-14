import { client } from "../../../../shared/constants/baseApi";
import {
  useSuspenseQuery,
  UseSuspenseQueryOptions,
} from "@tanstack/react-query";

export interface GetAnnouncementPdfParams {
  announcement_id: string;
}

export const getAnnouncementPdf = async ({
  announcement_id,
}: GetAnnouncementPdfParams): Promise<Blob> => {
  const response = await client.get(`/announcements/${announcement_id}/pdf`, {
    responseType: "blob",
  });
  return response.data;
};

export type OptionsWithoutKeyFn = Omit<
  UseSuspenseQueryOptions<Blob>,
  "queryKey" | "queryFn"
>;

interface UseGetAnnouncementPdf {
  params: GetAnnouncementPdfParams;
  options?: OptionsWithoutKeyFn;
}

export const useGetAnnouncementPdf = ({
  params,
  options,
}: UseGetAnnouncementPdf) => {
  return useSuspenseQuery<Blob>({
    queryKey: ["announcementPdf", params.announcement_id],
    queryFn: () => getAnnouncementPdf(params),
    ...options,
  });
};
