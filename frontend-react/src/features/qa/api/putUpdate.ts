import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../../../shared/constants/baseApi";
import queryKeys from "./queryKey";

export interface UpdateQuestionRequest {
  id: string;
  title: string;
  content: string;
  upvotes: number;
}

export const updateQuestion = async (data: UpdateQuestionRequest) => {
  const response = await client.put("/questions/update", data);
  return response.data;
};

export const useUpdateQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
};
