import { useState } from "react";
import { updateCondition, useUpdateCondition } from "../api/putUpdate";
import Condition from "./Condition";
import ConditionMemo from "./ConditionMemo";
import { useParams } from "react-router-dom";

export default function ConditionList() {
  const [editingConditionId, setEditingConditionId] = useState<string | null>(
    null,
  );
  // 컨디션별 메모 상태: 1개만
  const [conditionMemos, setConditionMemos] = useState<Record<string, string>>(
    {},
  );
  const [openConditionMemo, setOpenConditionMemo] = useState<string | null>(
    null,
  );

  const params = useParams();

  // 컨디션 편집
  const handleConditionEdit = (
    categoryId: string,
    condition: any,
    newCondition: string,
  ) => {
    const key = `${categoryId}-${condition.text}`;
    setEditedConditions((prev) => ({ ...prev, [key]: newCondition }));
  };

  return (
    <div className="space-y-2">
      {localConditions.map((condition, index) => {
        const conditionKey = `${category.id}-${condition.text}`;
        const memoCount = memos[conditionKey]?.length || 0;
        const isExpanded = expandedMemoSections[conditionKey];
        // 동적 border 색상
        const borderColor = condition.color || "#3b82f6"; // 없으면 기존 blue-500
        return (
          <div
            key={index}
            className="bg-gray-800/80 dark:bg-gray-700 rounded-lg pl-2 pr-2 py-2 flex flex-col shadow-sm border-l-4 border-t-0 border-r-0 border-b-0 ml-2 my-1"
            style={{ borderLeftColor: borderColor }}
            data-condition-id={condition.id}
            onMouseEnter={() =>
              setConditionHovered((prev) => ({ ...prev, [index]: true }))
            }
            onMouseLeave={() =>
              setConditionHovered((prev) => ({ ...prev, [index]: false }))
            }
          >
            <Condition />
            {/* 메모 textarea를 버튼 옆이 아니라, 컨디션 전체 아래(세로)로 위치 */}
            {openConditionMemo === conditionKey && <ConditionMemo />}
          </div>
        );
      })}
    </div>
  );
}
