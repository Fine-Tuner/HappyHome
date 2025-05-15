import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../../../../shared/constants/baseApi";
import queryKeys from "../../../announcement/api/queryKey";

export interface CreateConditionRequest {
  announcement_id: string;
  original_id: string;
  category_id: string;
  content: string;
  comment?: string;
  section: string;
  page: number;
  bbox: number[][];
  user_id: string;
}

export const createCondition = async (data: CreateConditionRequest) => {
  const response = await client.post("/conditions/create", data);
  return response.data;
};

export const useCreateCondition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCondition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.list() });
    },
  });
};
