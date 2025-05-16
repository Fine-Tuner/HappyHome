import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../../../shared/constants/baseApi";
import queryKeys from "../../announcement/api/queryKey";

export interface DeleteConditionRequest {
  user_condition_id: string;
  announcement_id: string;
  user_id?: string;
}

export interface DeleteConditionResponse {
  id: string;
  announcement_id: string;
  original_id: string;
  category_id: string;
  content: string;
  comment: string;
  section: string;
  page: number;
  bbox: number[];
  user_id: string;
  is_deleted: boolean;
}

export const deleteCondition = async (
  data: DeleteConditionRequest,
): Promise<DeleteConditionResponse> => {
  const response = await client.delete("/conditions/delete", { data });
  return response.data;
};

export const useDeleteCondition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCondition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.list() });
    },
  });
};
