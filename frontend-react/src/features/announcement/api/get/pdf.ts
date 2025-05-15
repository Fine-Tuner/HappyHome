import { client } from "../../../../shared/constants/baseApi";
import {
  useSuspenseQuery,
  UseSuspenseQueryOptions,
} from "@tanstack/react-query";

export interface GetAnnouncementPdfParams {
  announcementId: string;
}

export const getAnnouncementPdf = async ({
  announcementId,
}: GetAnnouncementPdfParams): Promise<Blob> => {
  const response = await client.get(`/announcements/${announcementId}/pdf`, {
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
    queryKey: ["announcementPdf", params.announcementId],
    queryFn: () => getAnnouncementPdf(params),
    ...options,
  });
};
