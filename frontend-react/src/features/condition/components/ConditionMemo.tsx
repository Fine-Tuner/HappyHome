import { useParams } from "react-router-dom";
import { useUpdateCondition } from "../api/putUpdate";

export default function ConditionMemo() {
  const params = useParams();
  const { mutate: updateCondition } = useUpdateCondition(params.id!);

  return (
    <div className="mt-2 px-2">
      <textarea
        className="w-full p-2 text-xs rounded bg-gray-700 border border-green-400 text-white"
        rows={2}
        value={conditionMemos[conditionKey] || ""}
        onChange={(e) =>
          setConditionMemos((prev) => ({
            ...prev,
            [conditionKey]: e.target.value,
          }))
        }
        onBlur={() => {
          updateCondition({
            id: condition.id,
            comment: conditionMemos[conditionKey] || "",
            bbox: [
              condition.bbox.x,
              condition.bbox.y,
              condition.bbox.width,
              condition.bbox.height,
            ],
            is_deleted: false,
          });
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            (e.target as HTMLTextAreaElement).blur();
          }
        }}
        placeholder="메모를 입력하세요"
      />
    </div>
  );
}
