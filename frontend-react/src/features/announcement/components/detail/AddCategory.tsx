import { useState } from "react";
import { useCreateCategory } from "../../../category/api/postCreate";
import { useQueryClient } from "@tanstack/react-query";
import { queryClient } from "../../../../app/AppContextProvider";
import queryKeys from "../../api/queryKey";
import { useParams } from "react-router-dom";

export default function AddCategory() {
  const params = useParams();

  const { mutate: createCategory, status: createCategoryStatus } =
    useCreateCategory();

  const isCreatingCategory = createCategoryStatus === "pending";
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  return (
    <div className="mt-4 flex flex-col items-center">
      {isAddCategoryOpen ? (
        <div className="flex flex-col gap-2 w-full max-w-md bg-gray-800 border border-gray-700 rounded-lg p-4">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="새 카테고리 이름"
            className="px-2 py-1 rounded bg-gray-700 border border-gray-600 text-white text-sm"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setIsAddCategoryOpen(false)}
              className="px-3 py-1 text-sm rounded bg-gray-600 text-gray-200 hover:bg-gray-500"
              disabled={isCreatingCategory}
            >
              취소
            </button>
            <button
              onClick={() => {
                if (!newCategoryName.trim()) return;
                createCategory(
                  {
                    name: newCategoryName,
                    announcement_id: params.id || "",
                  },
                  {
                    onSuccess: () => {
                      setNewCategoryName("");
                      setIsAddCategoryOpen(false);
                      queryClient.invalidateQueries({
                        queryKey: queryKeys.detail(params.id!),
                      });
                    },
                  },
                );
              }}
              className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
              disabled={isCreatingCategory || !newCategoryName.trim()}
            >
              {isCreatingCategory ? "추가 중..." : "추가"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAddCategoryOpen(true)}
          className="px-4 py-2 mt-2 rounded bg-blue-700 text-white hover:bg-blue-800 text-sm font-semibold shadow"
        >
          + 카테고리 추가
        </button>
      )}
    </div>
  );
}
