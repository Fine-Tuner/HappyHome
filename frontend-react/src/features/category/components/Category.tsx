import { use, useState } from "react";
import { Condition } from "../../announcement/api/getAnnouncement";
import CategoryMemo from "./CategoryMemo";
import CategoryOptions from "./CategoryOptions";
import CategoryTitle from "./CategoryTitle";
import ConditionList from "../../condition/components/ConditionList";
import { CategoryWithConditions } from "../types/categoryWithConditions";

interface Props {
  category: CategoryWithConditions;
  localConditions: Condition[];
  isHover: boolean;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  expandedCategories: Record<string, boolean>;
  onToggleCategory: (categoryId: string) => void;
}

export default function Category({
  category,
  localConditions,
  isHover,
  iframeRef,
  expandedCategories,
  onToggleCategory,
}: Props) {
  const [isCategoryMemoOpen, setIsCategoryMemoOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(category.name);

  // 카테고리가 펼쳐져 있는지 확인 (기본값 false)
  const isExpanded = expandedCategories[category.id] ?? false;

  const handleToggleCategory = (categoryId: string) => {
    onToggleCategory(categoryId);
  };

  return (
    <>
      <div className="flex items-center justify-between relative py-1 px-2">
        <CategoryOptions
          category={category}
          expandedCategories={expandedCategories}
          isCategoryMemoOpen={isCategoryMemoOpen}
          setIsCategoryMemoOpen={setIsCategoryMemoOpen}
          onToggleCategory={handleToggleCategory}
          setIsEditingTitle={setIsEditingTitle}
          setEditedTitle={setEditedTitle}
        />
        <CategoryTitle
          category={category}
          localConditions={localConditions}
          expandedCategories={expandedCategories}
          handleToggleCategory={handleToggleCategory}
          isEditingTitle={isEditingTitle}
          editedTitle={editedTitle}
          setIsEditingTitle={setIsEditingTitle}
          setEditedTitle={setEditedTitle}
        />
      </div>
      <CategoryMemo
        isCategoryMemoOpen={isCategoryMemoOpen}
        category={category}
        setIsCategoryMemoOpen={setIsCategoryMemoOpen}
        expandedCategories={expandedCategories}
        onToggleCategory={handleToggleCategory}
      />
      {isExpanded && (
        <ConditionList
          localConditions={localConditions}
          iframeRef={iframeRef}
        />
      )}
    </>
  );
}
