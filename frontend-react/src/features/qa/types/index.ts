export interface Question {
  id: string;
  title: string;
  content: string;
  user_id: string;
  upvotes: number;
  views: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  // UI에서 사용할 추가 필드들
  hasLiked?: boolean;
  commentsCount?: number;
}

export interface Comment {
  id: string;
  questionId: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  likes: number;
  hasLiked: boolean;
}

export interface CreateQuestionRequest {
  title: string;
  content: string;
}

export interface CreateCommentRequest {
  questionId: string;
  content: string;
}
