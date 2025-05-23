import { Condition as ConditionType } from "../../announcement/api/getAnnouncement";
import Condition from "./Condition";

interface Props {
  localConditions: ConditionType[];
  iframeRef: React.RefObject<HTMLIFrameElement>;
}

export default function ConditionList({ localConditions, iframeRef }: Props) {
  console.log("localConditions", localConditions);

  // // 컨디션별 메모 상태: 1개만
  // const [conditionMemos, setConditionMemos] = useState<Record<string, string>>(
  //   {},
  // );
  // const [openConditionMemo, setOpenConditionMemo] = useState<string | null>(
  //   null,
  // );

  return (
    <div className="space-y-2">
      {localConditions.map((condition, index) => {
        const conditionKey = `${condition.id}-${condition.text}`;
        // const memoCount = memos[conditionKey]?.length || 0;
        // const isExpanded = expandedMemoSections[conditionKey];
        // 동적 border 색상
        const borderColor = condition.color || "#3b82f6"; // 없으면 기존 blue-500
        return (
          <div
            key={index}
            className="flex flex-col py-2 pl-2 pr-2 my-1 ml-2 border-t-0 border-b-0 border-l-4 border-r-0 rounded-lg shadow-sm bg-gray-800/80 dark:bg-gray-700"
            style={{ borderLeftColor: borderColor }}
            data-condition-id={condition.id}
            // onMouseEnter={() =>
            //   setConditionHovered((prev) => ({ ...prev, [index]: true }))
            // }
            // onMouseLeave={() =>
            //   setConditionHovered((prev) => ({ ...prev, [index]: false }))
            // }
          >
            <Condition condition={condition} iframeRef={iframeRef} />
            {/* 메모 textarea를 버튼 옆이 아니라, 컨디션 전체 아래(세로)로 위치 */}
            {/* {openConditionMemo === conditionKey && <ConditionMemo />} */}
          </div>
        );
      })}
    </div>
  );
}
