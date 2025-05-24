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
import ConditionList from "../../condition/components/ConditionList";

interface Memo {
  id: string;
  content: string;
  createdAt: string;
}

interface CategorySectionProps {
  category: CategoryWithConditions;
  iframeRef: React.RefObject<HTMLIFrameElement>;
}

export default function CategoryContainer({
  category,
  iframeRef,
}: CategorySectionProps) {
  const [localConditions, setLocalConditions] = useState(category.conditions);

  useEffect(() => {
    setLocalConditions(category.conditions);
  }, [category.conditions]);

  return (
    <div className="mx-2 mb-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-md shadow-xl relative overflow-visible">
      <Category
        localConditions={localConditions}
        category={category}
        isHover={true}
        iframeRef={iframeRef}
      />
    </div>
  );
}
