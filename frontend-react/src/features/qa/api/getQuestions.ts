import { useQuery } from "@tanstack/react-query";
import { client } from "../../../shared/constants/baseApi";
import queryKeys from "./queryKey";

export interface QuestionResponse {
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

export interface GetQuestionsParams {
  skip?: number;
  limit?: number;
}

export const getQuestions = async (
  params: GetQuestionsParams = {}
): Promise<QuestionResponse[]> => {
  const { skip = 0, limit = 100 } = params;
  const response = await client.get("/questions/", {
    params: { skip, limit },
  });
  return response.data;
};

export const useGetQuestions = (params: GetQuestionsParams = {}) => {
  return useQuery({
    queryKey: queryKeys.list(params.skip, params.limit),
    queryFn: () => getQuestions(params),
  });
};
