import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../../../shared/constants/baseApi";
import queryKeys from "../../announcement/api/queryKey";

export interface CreateConditionRequest {
  announcement_id: string;
  category_id?: string;
  content?: string;
  section?: string;
  page: number;
  bbox: number[][];
  comment?: string;
  color: string;
}

export const createCondition = async (data: CreateConditionRequest) => {
  const response = await client.post("/conditions/create", data);
  return response.data;
};

export const useCreateCondition = (announcementId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCondition,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.detail(announcementId),
      });
    },
  });
};
