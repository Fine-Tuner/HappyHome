import { useParams } from "react-router-dom";
import { useUpdateCondition } from "../api/putUpdate";
import { Condition } from "../../announcement/api/getAnnouncement";

interface Props {
  condition: Condition;
  editingCondition: boolean;
  editedConditionText: string;
  handleConditionClick: () => void;
  handleConditionEditText: (newConditionText: string) => void;
}

export default function ConditionText({
  condition,
  editingCondition,
  editedConditionText,
  handleConditionClick,
  handleConditionEditText,
}: Props) {
  const params = useParams();
  const { mutate: updateCondition } = useUpdateCondition(params.id!);

  const handleSaveCondition = (condition: Condition) => {
    updateCondition({
      id: condition.id,
      content: editedConditionText,
      comment: "",
      bbox: condition.bbox,
      is_deleted: false,
    });
    handleConditionClick();
  };

  return (
    <div className="flex items-center flex-1">
      {editingCondition ? (
        <textarea
          className="w-full p-1.5 text-xs rounded-lg border border-teal-400 focus:ring-2 focus:ring-teal-500 bg-gray-800 text-white"
          rows={2}
          value={editedConditionText ?? condition.text}
          onChange={(e) => handleConditionEditText(e.target.value)}
          onBlur={() => handleSaveCondition(condition)}
          autoFocus
        />
      ) : (
        <div
          className="p-1.5 text-sm text-white bg-transparent hover:bg-gray-700/50 rounded-lg cursor-pointer transition flex items-center"
          onClick={() => handleConditionClick()}
        >
          {condition.text}
          {/* 메모 개수 뱃지 */}
          {/* {memos[conditionKey]?.length > 0 && (
            <span
              className="ml-2 inline-flex items-center justify-center px-1 py-0.5 text-xs font-medium rounded-full bg-indigo-500/20 text-indigo-200"
              title="메모 개수"
            >
              메모:{memos[conditionKey].length}
            </span>
          )} */}
        </div>
      )}
    </div>
  );
}
