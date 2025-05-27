import { useState } from "react";
import { CreateCommentRequest } from "../types";

interface Props {
  questionId: string;
  onSubmit: (comment: CreateCommentRequest) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function CommentForm({
  questionId,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: Props) {
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit({ questionId, content: content.trim() });
      setContent("");
    }
  };

  const handleCancel = () => {
    setContent("");
    onCancel();
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="댓글을 작성해주세요"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none text-sm"
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors duration-200 text-sm ${
              !content.trim() || isSubmitting
                ? "bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                : "bg-teal-600 hover:bg-teal-700 text-white"
            }`}
          >
            {isSubmitting ? "작성 중..." : "댓글 작성"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors duration-200 text-sm ${
              isSubmitting
                ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
            }`}
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
