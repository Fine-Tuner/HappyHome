import { useState } from "react";
import {
  Question,
  Comment,
  CreateQuestionRequest,
  CreateCommentRequest,
} from "../types";
import { useGetQuestions } from "../api/getQuestions";
import { useCreateQuestion } from "../api/postCreate";
import { useUpdateQuestion } from "../api/putUpdate";
import { useDeleteQuestion } from "../api/delete";
import { UpdateQuestionRequest } from "../api/putUpdate";
import QuestionForm from "./QuestionForm";
import QuestionItem from "./QuestionItem";

interface Props {
  // API 연동을 위한 props들
}

export default function QuestionList({}: Props) {
  const [showQuestionForm, setShowQuestionForm] = useState(false);

  // API 훅들
  const { data: questionsData = [], isLoading, error } = useGetQuestions();
  const createQuestionMutation = useCreateQuestion();
  const updateQuestionMutation = useUpdateQuestion();
  const deleteQuestionMutation = useDeleteQuestion();

  // TODO: 실제로는 인증 컨텍스트나 API에서 현재 사용자 정보를 가져와야 함
  const currentUserId = "f93a45d8-0d70-428a-9654-f7eab2543520"; // Mock 현재 사용자 ID
  // Mock data for comments - 실제로는 별도 API에서 가져올 데이터
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
    try {
      await createQuestionMutation.mutateAsync(question);
      setShowQuestionForm(false);
    } catch (error) {
      console.error("질문 작성 실패:", error);
    }
  };

  const handleQuestionUpdate = async (question: UpdateQuestionRequest) => {
    try {
      await updateQuestionMutation.mutateAsync(question);
    } catch (error) {
      console.error("질문 수정 실패:", error);
      throw error; // QuestionItem에서 에러 처리를 위해 다시 throw
    }
  };

  const handleQuestionLike = async (questionId: string) => {
    try {
      // TODO: 질문 추천 API 호출
      console.log("질문 추천:", questionId);
    } catch (error) {
      console.error("질문 추천 실패:", error);
    }
  };

  const handleCommentCreate = async (comment: CreateCommentRequest) => {
    try {
      // TODO: 댓글 작성 API 호출
      console.log("새 댓글 작성:", comment);
      await new Promise((resolve) => setTimeout(resolve, 500)); // Mock delay
    } catch (error) {
      console.error("댓글 작성 실패:", error);
    }
  };

  const handleCommentLike = async (commentId: string) => {
    try {
      // TODO: 댓글 추천 API 호출
      console.log("댓글 추천:", commentId);
    } catch (error) {
      console.error("댓글 추천 실패:", error);
    }
  };

  const handleQuestionDelete = async (questionId: string) => {
    try {
      const confirmed = window.confirm("정말로 이 질문을 삭제하시겠습니까?");
      if (confirmed) {
        await deleteQuestionMutation.mutateAsync(questionId);
      }
    } catch (error) {
      console.error("질문 삭제 실패:", error);
    }
  };

  const getQuestionComments = (questionId: string) => {
    return comments.filter((comment) => comment.questionId === questionId);
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              질문과 답변
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              궁금한 점을 질문하거나 정보를 공유할 수 있습니다.
            </p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-2">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              질문과 답변
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              궁금한 점을 질문하거나 정보를 공유할 수 있습니다.
            </p>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-red-500 dark:text-red-400">
            데이터를 불러오는 중 오류가 발생했습니다.
          </p>
        </div>
      </div>
    );
  }

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
          isSubmitting={createQuestionMutation.isPending}
        />
      )}

      {/* 질문 목록 */}
      <div className="space-y-3">
        {questionsData.length === 0 ? (
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
          // 내가 작성한 질문을 상단에, 다른 질문들을 그 아래에 배치
          [...questionsData]
            .sort((a, b) => {
              const aIsMyQuestion = a.user_id === currentUserId;
              const bIsMyQuestion = b.user_id === currentUserId;

              // 내가 작성한 질문이 상단에 오도록 정렬
              if (aIsMyQuestion && !bIsMyQuestion) return -1;
              if (!aIsMyQuestion && bIsMyQuestion) return 1;

              // 같은 그룹 내에서는 최신순으로 정렬
              return (
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
              );
            })
            .map((question) => (
              <QuestionItem
                key={question.id}
                question={question}
                comments={getQuestionComments(question.id)}
                onQuestionLike={handleQuestionLike}
                onCommentCreate={handleCommentCreate}
                onCommentLike={handleCommentLike}
                onQuestionUpdate={handleQuestionUpdate}
                onQuestionDelete={handleQuestionDelete}
                currentUserId={currentUserId}
              />
            ))
        )}
      </div>
    </div>
  );
}
