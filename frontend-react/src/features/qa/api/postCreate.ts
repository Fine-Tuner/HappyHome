import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../../../shared/constants/baseApi";
import queryKeys from "./queryKey";

export interface CreateQuestionRequest {
  title: string;
  content: string;
}

export interface CreateQuestionResponse {
  id: string;
  title: string;
  content: string;
  user_id: string;
  upvotes: number;
  views: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export const createQuestion = async (
  data: CreateQuestionRequest,
): Promise<CreateQuestionResponse> => {
  const response = await client.post("/questions/create", data);
  return response.data;
};

export const useCreateQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
  });
};
