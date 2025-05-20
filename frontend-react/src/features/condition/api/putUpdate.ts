import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../../../shared/constants/baseApi";
import queryKeys from "../../announcement/api/queryKey";

export interface ConditionUpdateRequest {
  id: string;
  content?: string;
  section?: string;
  page?: number;
  bbox?: number[][];
  comment?: string;
  color?: string;
  is_deleted?: boolean;
}

export const updateCondition = async (data: ConditionUpdateRequest) => {
  const response = await client.put("/conditions/update", data);
  return response.data;
};

export const useUpdateCondition = (announcementId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCondition,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.detail(announcementId),
      });
    },
  });
};
