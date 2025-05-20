import ConditionOptions from "./ConditionOptions";
import ConditionTitle from "./ConditionTitle";

export default function Condition() {
  return (
    <div className="flex items-start gap-2 pl-2">
      <ConditionTitle />
      <ConditionOptions />
    </div>
  );
}
