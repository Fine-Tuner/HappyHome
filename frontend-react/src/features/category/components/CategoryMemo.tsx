import { useState } from "react";
import { updateCategory, useUpdateCategory } from "../api/putUpdate";
import { useParams } from "react-router-dom";

interface Props {
  isCategoryMemoOpen: boolean;
}
export default function CategoryMemo({ isCategoryMemoOpen }: Props) {
  const params = useParams();
  // 카테고리(주제) 메모 상태: 1개만
  const [categoryMemo, setCategoryMemo] = useState("");
  const { mutate: updateCategory } = useUpdateCategory(params.id!);

  return (
    <>
      {isCategoryMemoOpen && (
        <div className="mt-2 mb-2 px-2">
          <textarea
            className="w-full p-2 text-xs rounded bg-gray-700 border border-purple-400 text-white"
            rows={3}
            value={categoryMemo}
            onChange={(e) => setCategoryMemo(e.target.value)}
            onBlur={() => {
              updateCategory({
                id: category.id,
                comment: categoryMemo,
              });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                (e.target as HTMLTextAreaElement).blur();
              }
            }}
            placeholder="주제 요약 메모를 입력하세요"
          />
        </div>
      )}
    </>
  );
}
