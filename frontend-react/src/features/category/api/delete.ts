import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../../../shared/constants/baseApi";
import queryKeys from "../../announcement/api/queryKey";

export const deleteCategory = async (categoryId: string) => {
  const response = await client.delete(`/categories/delete?id=${categoryId}`);
  return response.data;
};

export const useDeleteCategory = (announcementId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.detail(announcementId),
      });
    },
  });
};
