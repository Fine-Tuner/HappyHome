import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../../../shared/constants/baseApi";
import queryKeys from "../../announcement/api/queryKey";

export interface CategoryUpdateRequest {
  id: string;
  name?: string;
  comment?: string;
}

export const updateCategory = async (data: CategoryUpdateRequest) => {
  const response = await client.put("/categories/update", data);
  return response.data;
};

export const useUpdateCategory = (announcementId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.detail(announcementId),
      });
    },
  });
};
