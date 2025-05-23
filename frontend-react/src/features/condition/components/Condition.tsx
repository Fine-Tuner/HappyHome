import { useState } from "react";
import ConditionOptions from "./ConditionOptions";
import ConditionText from "./ConditionText";
import { Condition as ConditionType } from "../../announcement/api/getAnnouncement";

interface Props {
  condition: ConditionType;
  iframeRef: React.RefObject<HTMLIFrameElement>;
}
export default function Condition({ condition, iframeRef }: Props) {
  const [editingCondition, setEditingCondition] = useState<boolean>(false);
  const [editedConditionText, setEditedConditionText] = useState<string>(
    condition.text,
  );

  const handleConditionClick = () => {
    setEditingCondition((prev) => !prev);
  };

  const handleConditionEditText = (newConditionText: string) => {
    setEditedConditionText(newConditionText);
  };

  return (
    <div className="flex items-start gap-2 pl-2">
      <ConditionText
        condition={condition}
        editingCondition={editingCondition}
        editedConditionText={editedConditionText}
        handleConditionClick={handleConditionClick}
        handleConditionEditText={handleConditionEditText}
      />
      <ConditionOptions condition={condition} iframeRef={iframeRef} />
    </div>
  );
}
