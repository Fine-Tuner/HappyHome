import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../../../shared/constants/baseApi";
import queryKeys from "../../announcement/api/queryKey";

export interface UpdateCategoryParams {
  announcement_id: string;
  user_category_id: string;
  user_id: string;
}

export interface UpdateCategoryBody {
  name: string;
  comment: string;
  is_deleted: boolean;
  updated_at: string;
}

export const updateCategory = async (
  params: UpdateCategoryParams,
  body: UpdateCategoryBody,
) => {
  const response = await client.put("/categories/update", body, { params });
  return response.data;
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      params,
      body,
    }: {
      params: UpdateCategoryParams;
      body: UpdateCategoryBody;
    }) => updateCategory(params, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.list() });
    },
  });
};
