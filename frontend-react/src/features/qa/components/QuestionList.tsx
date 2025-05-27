import { useState } from "react";
import {
  Question,
  Comment,
  CreateQuestionRequest,
  CreateCommentRequest,
} from "../types";
import QuestionForm from "./QuestionForm";
import QuestionItem from "./QuestionItem";

interface Props {
  // API 연동을 위한 props들 (현재는 mock data 사용)
}

export default function QuestionList({}: Props) {
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [isQuestionSubmitting, setIsQuestionSubmitting] = useState(false);
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);

  // Mock data - 실제로는 API에서 가져올 데이터
  const [questions] = useState<Question[]>([
    {
      id: "1",
      title: "이 공고문에서 소득 제한이 어떻게 계산되나요?",
      content:
        "저는 현재 무직이지만 배우자가 직장을 다니고 있습니다. 이런 경우 소득 제한을 어떻게 계산해야 하는지 궁금합니다.\n\n관련 내용이 공고문에 있지만 이해가 어렵네요.",
      author: "John Kim",
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-15T10:30:00Z",
      likes: 12,
      hasLiked: false,
      commentsCount: 3,
    },
    {
      id: "2",
      title: "청약 신청 시 필요한 서류가 무엇인가요?",
      content:
        "처음 행복주택에 신청해보려고 하는데, 어떤 서류들을 준비해야 하는지 알려주세요.",
      author: "Sarah Lee",
      createdAt: "2024-01-14T15:45:00Z",
      updatedAt: "2024-01-14T15:45:00Z",
      likes: 8,
      hasLiked: true,
      commentsCount: 5,
    },
    {
      id: "3",
      title: "입주 예정일이 언제인가요?",
      content: "선정되면 언제쯤 입주할 수 있는지 알고 싶습니다.",
      author: "Mike Park",
      createdAt: "2024-01-13T09:20:00Z",
      updatedAt: "2024-01-13T09:20:00Z",
      likes: 5,
      hasLiked: false,
      commentsCount: 2,
    },
  ]);

  const [comments] = useState<Comment[]>([
    {
      id: "c1",
      questionId: "1",
      content: "저도 같은 상황인데 궁금하네요. 혹시 아시는 분 계신가요?",
      author: "Emily Choi",
      createdAt: "2024-01-15T11:15:00Z",
      updatedAt: "2024-01-15T11:15:00Z",
      likes: 3,
      hasLiked: false,
    },
    {
      id: "c2",
      questionId: "1",
      content:
        "배우자 소득도 포함해서 계산해야 합니다. 공고문 3페이지에 자세한 내용이 있어요.",
      author: "Expert User",
      createdAt: "2024-01-15T12:30:00Z",
      updatedAt: "2024-01-15T12:30:00Z",
      likes: 8,
      hasLiked: true,
    },
    {
      id: "c3",
      questionId: "1",
      content: "감사합니다! 도움이 되었어요.",
      author: "John Kim",
      createdAt: "2024-01-15T13:00:00Z",
      updatedAt: "2024-01-15T13:00:00Z",
      likes: 1,
      hasLiked: false,
    },
    {
      id: "c4",
      questionId: "2",
      content: "주민등록등본, 소득증명서, 재직증명서 등이 필요합니다.",
      author: "Helper",
      createdAt: "2024-01-14T16:20:00Z",
      updatedAt: "2024-01-14T16:20:00Z",
      likes: 4,
      hasLiked: false,
    },
    {
      id: "c5",
      questionId: "2",
      content: "혼인관계증명서도 필요한 경우가 있으니 확인해보세요.",
      author: "Experienced",
      createdAt: "2024-01-14T17:00:00Z",
      updatedAt: "2024-01-14T17:00:00Z",
      likes: 2,
      hasLiked: false,
    },
  ]);

  const handleQuestionSubmit = async (question: CreateQuestionRequest) => {
    setIsQuestionSubmitting(true);
    try {
      // TODO: API 호출
      console.log("새 질문 작성:", question);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Mock delay
      setShowQuestionForm(false);
    } catch (error) {
      console.error("질문 작성 실패:", error);
    } finally {
      setIsQuestionSubmitting(false);
    }
  };

  const handleQuestionLike = async (questionId: string) => {
    try {
      // TODO: API 호출
      console.log("질문 추천:", questionId);
    } catch (error) {
      console.error("질문 추천 실패:", error);
    }
  };

  const handleCommentCreate = async (comment: CreateCommentRequest) => {
    setIsCommentSubmitting(true);
    try {
      // TODO: API 호출
      console.log("새 댓글 작성:", comment);
      await new Promise((resolve) => setTimeout(resolve, 500)); // Mock delay
    } catch (error) {
      console.error("댓글 작성 실패:", error);
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const handleCommentLike = async (commentId: string) => {
    try {
      // TODO: API 호출
      console.log("댓글 추천:", commentId);
    } catch (error) {
      console.error("댓글 추천 실패:", error);
    }
  };

  const getQuestionComments = (questionId: string) => {
    return comments.filter((comment) => comment.questionId === questionId);
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            질문과 답변
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            궁금한 점을 질문하거나 정보를 공유할 수 있습니다.
          </p>
        </div>
        <button
          onClick={() => setShowQuestionForm(!showQuestionForm)}
          className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors duration-200 text-sm"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 4.5V19.5M4.5 12H19.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {showQuestionForm ? "취소" : "질문 작성"}
        </button>
      </div>

      {/* 질문 작성 폼 */}
      {showQuestionForm && (
        <QuestionForm
          onSubmit={handleQuestionSubmit}
          onCancel={() => setShowQuestionForm(false)}
          isSubmitting={isQuestionSubmitting}
        />
      )}

      {/* 질문 목록 */}
      <div className="space-y-3">
        {questions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-gray-400"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 17h.01"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              아직 질문이 없습니다
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              첫 번째 질문을 작성해보세요!
            </p>
          </div>
        ) : (
          questions.map((question) => (
            <QuestionItem
              key={question.id}
              question={question}
              comments={getQuestionComments(question.id)}
              onQuestionLike={handleQuestionLike}
              onCommentCreate={handleCommentCreate}
              onCommentLike={handleCommentLike}
              isCommentSubmitting={isCommentSubmitting}
            />
          ))
        )}
      </div>
    </div>
  );
}
