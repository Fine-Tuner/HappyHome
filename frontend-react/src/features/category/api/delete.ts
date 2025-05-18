import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../../../shared/constants/baseApi";
import queryKeys from "../../announcement/api/queryKey";

export interface DeleteCategoryRequest {
  announcement_id: string;
  user_category_id: string;
  user_id: string;
}

export const deleteCategory = async (data: DeleteCategoryRequest) => {
  const response = await client.delete("/categories/delete", { data });
  return response.data;
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.list() });
    },
  });
};
