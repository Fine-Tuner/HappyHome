import { Comment } from "../types";

interface Props {
  comment: Comment;
  onLike: (commentId: string) => void;
}

export default function CommentItem({ comment, onLike }: Props) {
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

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700/50">
      {/* 댓글 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-2">
          <span className="font-medium">{comment.author}</span>
          <span>•</span>
          <span>{formatDate(comment.createdAt)}</span>
          {comment.createdAt !== comment.updatedAt && (
            <>
              <span>•</span>
              <span className="text-xs">수정됨</span>
            </>
          )}
        </div>
      </div>

      {/* 댓글 내용 */}
      <div className="mb-2">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap text-xs">
          {comment.content}
        </p>
      </div>

      {/* 추천 버튼 */}
      <div className="flex items-center">
        <button
          onClick={() => onLike(comment.id)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors duration-200 text-xs ${
            comment.hasLiked
              ? "bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400"
              : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
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
          <span className="font-medium">{comment.likes}</span>
        </button>
      </div>
    </div>
  );
}
