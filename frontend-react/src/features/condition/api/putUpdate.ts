import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../../../shared/constants/baseApi";
import queryKeys from "../../announcement/api/queryKey";

export interface UpdateConditionParams {
  announcement_id: string;
  user_condition_id: string;
  user_id: string;
}

export interface UpdateConditionBody {
  content: string;
  comment: string;
  category_id: string;
  bbox: number[];
  is_deleted: boolean;
  updated_at: string;
}

export const updateCondition = async (
  params: UpdateConditionParams,
  body: UpdateConditionBody,
) => {
  const response = await client.put("/conditions/update", body, { params });
  return response.data;
};

export const useUpdateCondition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      params,
      body,
    }: {
      params: UpdateConditionParams;
      body: UpdateConditionBody;
    }) => updateCondition(params, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.list() });
    },
  });
};
