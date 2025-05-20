import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Condition } from "../../announcement/api/getAnnouncement";
import { useUpdateCategory } from "../api/putUpdate";
import { useDeleteCategory } from "../api/delete";
import { useUpdateCondition } from "../../condition/api/putUpdate";
import { useDeleteCondition } from "../../condition/api/delete";
import ConfirmAlert from "../../../shared/components/Confirm/ConfirmAlert";
import Category from "./Category";
import { CategoryWithConditions } from "../types/categoryWithConditions";

interface Memo {
  id: string;
  content: string;
  createdAt: string;
}

interface CategorySectionProps {
  category: CategoryWithConditions;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

export default function CategoryContainer({
  category,
  iframeRef,
}: CategorySectionProps) {
  // const [memos, setMemos] = useState<Record<string, Memo[]>>({});
  // const [newMemo, setNewMemo] = useState<Record<string, string>>({});
  // const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  // const [editingMemoValue, setEditingMemoValue] = useState<string>("");
  // const [expandedMemoSections, setExpandedMemoSections] = useState<
  //   Record<string, boolean>
  // >({});

  // const [editedConditions, setEditedConditions] = useState<
  //   Record<string, string>
  // >({});

  // // 컨디션(구 Contents) 확장/축소 토글
  // const handleToggleCondition = (
  //   categoryId: string,
  //   conditionIndex: number,
  // ) => {
  //   const key = `${categoryId}-${conditionIndex}`;
  //   setExpandedConditions((prev) => ({ ...prev, [key]: !prev[key] }));
  // };

  const [localConditions, setLocalConditions] = useState(category.conditions);
  useEffect(() => {
    setLocalConditions(category.conditions);
  }, [category.conditions]);

  // const params = useParams();

  // const handleConditionClick = (categoryId: string, condition: Condition) => {
  //   setEditingConditionId(`${categoryId}-${condition.text}`);
  // };

  // const handleConditionEdit = (
  //   categoryId: string,
  //   condition: Condition,
  //   newCondition: string,
  // ) => {
  //   onConditionEdit(categoryId, condition, newCondition);
  // };

  // const [categoryHovered, setCategoryHovered] = useState(false);
  // const [conditionHovered, setConditionHovered] = useState<
  //   Record<number, boolean>
  // >({});

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-md p-2 border border-gray-200 dark:border-gray-700"
      // onMouseEnter={() => setCategoryHovered(true)}
      // onMouseLeave={() => setCategoryHovered(false)}
    >
      <Category localConditions={localConditions} category={category} />
      {/* <ConditionList localConditions={localConditions} /> */}
    </div>
  );
}
