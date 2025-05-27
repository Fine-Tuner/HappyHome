export interface Question {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  likes: number;
  hasLiked: boolean;
  commentsCount: number;
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
