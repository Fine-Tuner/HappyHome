import { useParams } from "react-router-dom";
import { useUpdateCondition } from "../api/putUpdate";

export default function ConditionTitle() {
  const params = useParams();
  const { mutate: updateCondition } = useUpdateCondition(params.id!);

  const handleSaveCondition = (condition: Condition) => {
    updateCondition({
      id: condition.id,
      content: editedConditions[`${category.id}-${condition.text}`] ?? "",
      comment: "",
      bbox: condition.bbox,
      is_deleted: false,
    });
    setEditingConditionId(null);
  };

  return (
    <div className="flex-1 flex items-center">
      {editingConditionId === conditionKey ? (
        <textarea
          className="w-full p-1.5 text-xs rounded-lg border border-blue-400 focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white"
          rows={2}
          value={editedConditions[conditionKey] ?? condition.text}
          onChange={(e) =>
            handleConditionEdit(category.id, condition, e.target.value)
          }
          onBlur={() => handleSaveCondition(condition)}
          autoFocus
        />
      ) : (
        <div
          className="p-1.5 text-sm text-white bg-transparent hover:bg-gray-700/50 rounded-lg cursor-pointer transition flex items-center"
          onClick={() => handleConditionClick(category.id, condition)}
        >
          {editedConditions[conditionKey] ?? condition.text}
          {/* 메모 개수 뱃지 */}
          {memos[conditionKey]?.length > 0 && (
            <span
              className="ml-2 inline-flex items-center justify-center px-1 py-0.5 text-xs font-medium rounded-full bg-indigo-500/20 text-indigo-200"
              title="메모 개수"
            >
              메모:{memos[conditionKey].length}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
