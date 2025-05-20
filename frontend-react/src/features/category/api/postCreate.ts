import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../../../shared/constants/baseApi";
import queryKeys from "../../announcement/api/queryKey";

export interface CreateCategoryRequest {
  announcement_id: string;
  name: string;
  comment?: string;
}

export interface CreateCategoryResponse {
  id: string;
  original_id?: string;
  user_id?: string;
  name: string;
  comment?: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export const createCategory = async (
  data: CreateCategoryRequest,
): Promise<CreateCategoryResponse> => {
  const response = await client.post("/categories/create", data);
  return response.data;
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.detail() });
    },
  });
};
