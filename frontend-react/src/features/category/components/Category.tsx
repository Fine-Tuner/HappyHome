import { use, useState } from "react";
import { Condition } from "../../announcement/api/getAnnouncement";
import CategoryMemo from "./CategoryMemo";
import CategoryOptions from "./CategoryOptions";
import CategoryTitle from "./CategoryTitle";
import { CategoryWithConditions } from "../types/categoryWithConditions";

interface Props {
  category: CategoryWithConditions;
  localConditions: Condition[];
  isHover: boolean;
}

export default function Category({
  category,
  localConditions,
  isHover,
}: Props) {
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const [isCategoryMemoOpen, setIsCategoryMemoOpen] = useState(false);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(category.name);

  const handleToggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  return (
    <>
      <div className="flex items-center justify-between relative pt-2 px-2">
        <CategoryOptions
          category={category}
          expandedCategories={expandedCategories}
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
      {expandedCategories[category.id] && (
        <CategoryMemo isCategoryMemoOpen={isCategoryMemoOpen} />
      )}
    </>
  );
}
