import { useState } from "react";
import { Question, Comment, CreateCommentRequest } from "../types";
import CommentForm from "./CommentForm";

interface Props {
  question: Question;
  comments: Comment[];
  onQuestionLike: (questionId: string) => void;
  onCommentCreate: (comment: CreateCommentRequest) => void;
  onCommentLike: (commentId: string) => void;
}

export default function QuestionItem({
  question,
  comments,
  onQuestionLike,
  onCommentCreate,
  onCommentLike,
}: Props) {
  const [showComments, setShowComments] = useState(false);
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;

    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleCommentSubmit = async (comment: CreateCommentRequest) => {
    setIsCommentSubmitting(true);
    try {
      await onCommentCreate(comment);
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const handleCommentToggle = () => {
    setShowComments(!showComments);
  };

  // user_id를 표시용으로 변환 (실제로는 user 정보를 별도 API에서 가져와야 함)
  const getDisplayName = (userId: string) => {
    // TODO: 실제로는 user API에서 사용자 정보를 가져와야 함
    const userMap: Record<string, string> = {
      user1: "John Kim",
      user2: "Sarah Lee",
      user3: "Mike Park",
    };
    return userMap[userId] || `사용자${userId}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-teal-200 dark:border-teal-700 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex gap-3">
        {/* 왼쪽 아이콘 영역 */}
        <div className="flex flex-col items-center gap-2">
          {/* 추천 아이콘 */}
          <button
            onClick={() => onQuestionLike(question.id)}
            className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg border-2 transition-colors duration-200 ${
              question.hasLiked
                ? "bg-teal-50 border-teal-300 text-teal-600 dark:bg-teal-900/20 dark:border-teal-600 dark:text-teal-400"
                : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-teal-900/20 dark:hover:border-teal-600 dark:hover:text-teal-400"
            }`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill={question.hasLiked ? "currentColor" : "none"}
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7 10V18C7 18.55 7.45 19 8 19H14.5C15.67 19 16.71 18.16 16.95 17.02L18.7 9.02C18.89 8.19 18.26 7.38 17.4 7.38H13L13.64 4.43C13.78 3.82 13.44 3.2 12.86 2.95C12.28 2.7 11.6 2.85 11.18 3.32L7 10ZM5 10H2C1.45 10 1 10.45 1 11V18C1 18.55 1.45 19 2 19H5C5.55 19 6 18.55 6 18V11C6 10.45 5.55 10 5 10Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-xs font-bold">{question.upvotes}</span>
          </button>

          {/* 댓글 아이콘 */}
          <button
            onClick={handleCommentToggle}
            className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg border-2 bg-gray-50 border-gray-200 text-gray-500 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-600 transition-colors duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-teal-900/20 dark:hover:border-teal-600 dark:hover:text-teal-400"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-xs font-bold">
              {question.commentsCount || 0}
            </span>
          </button>
        </div>

        {/* 오른쪽 내용 영역 */}
        <div className="flex-1 min-w-0">
          {/* 제목 */}
          <h4
            className="text-base font-semibold text-teal-600 dark:text-teal-400 mb-2 overflow-hidden"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              textOverflow: "ellipsis",
            }}
          >
            {question.title}
          </h4>

          {/* 내용 */}
          <div className="mb-3">
            <p
              className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed overflow-hidden"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                textOverflow: "ellipsis",
              }}
            >
              {question.content}
            </p>
          </div>

          {/* 메타 정보 */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{getDisplayName(question.user_id)}</span>
            <span>•</span>
            <span>{formatDate(question.created_at)}</span>
            {question.created_at !== question.updated_at && (
              <>
                <span>•</span>
                <span>수정됨</span>
              </>
            )}
            <span>•</span>
            <span>조회 {question.views}</span>
          </div>
        </div>
      </div>

      {/* 댓글 목록 및 작성 폼 */}
      {showComments && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          {/* 기존 댓글 목록 */}
          {comments.length > 0 && (
            <div className="space-y-2 mb-3">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-sm"
                >
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    {comment.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{comment.author}</span>
                      <span>•</span>
                      <span>{formatDate(comment.createdAt)}</span>
                    </div>
                    <button
                      onClick={() => onCommentLike(comment.id)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                        comment.hasLiked
                          ? "text-teal-600 dark:text-teal-400"
                          : "text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400"
                      }`}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill={comment.hasLiked ? "currentColor" : "none"}
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M7 10V18C7 18.55 7.45 19 8 19H14.5C15.67 19 16.71 18.16 16.95 17.02L18.7 9.02C18.89 8.19 18.26 7.38 17.4 7.38H13L13.64 4.43C13.78 3.82 13.44 3.2 12.86 2.95C12.28 2.7 11.6 2.85 11.18 3.32L7 10ZM5 10H2C1.45 10 1 10.45 1 11V18C1 18.55 1.45 19 2 19H5C5.55 19 6 18.55 6 18V11C6 10.45 5.55 10 5 10Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>{comment.likes}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 댓글 작성 폼 */}
          <CommentForm
            questionId={question.id}
            onSubmit={handleCommentSubmit}
            onCancel={() => setShowComments(false)}
            isSubmitting={isCommentSubmitting}
          />
        </div>
      )}
    </div>
  );
}
