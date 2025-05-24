import { useState, useEffect, useRef } from "react";
import { Condition } from "../../announcement/api/getAnnouncement";
import { useUpdateCondition } from "../api/putUpdate";
import { useParams } from "react-router-dom";

interface Props {
  condition: Condition;
  isOpen: boolean;
  onClose: () => void;
}

export default function ConditionMemo({ condition, isOpen, onClose }: Props) {
  const params = useParams();
  const [memo, setMemo] = useState(condition.comment || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { mutate: updateConditionMutation } = useUpdateCondition(params.id!);

  // condition 변경 시 메모 상태 업데이트
  useEffect(() => {
    setMemo(condition.comment || "");
  }, [condition.comment]);

  // 메모가 열릴 때마다 현재 메모 내용으로 초기화
  useEffect(() => {
    if (isOpen) {
      setMemo(condition.comment || "");
      // 다음 렌더링 사이클에서 커서를 맨 뒤로 이동
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const length = textareaRef.current.value.length;
          textareaRef.current.setSelectionRange(length, length);
          // 높이 자동 조절
          adjustTextareaHeight();
        }
      }, 10);
    }
  }, [isOpen, condition.comment]);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 60)}px`;
    }
  };

  const handleMemoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMemo(e.target.value);
    adjustTextareaHeight();
  };

  const handleSaveMemo = () => {
    updateConditionMutation({
      id: condition.id,
      comment: memo,
    });
    onClose();
  };

  const handleCancelEdit = () => {
    setMemo(condition.comment || "");
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="mt-2 mb-1">
      <textarea
        ref={textareaRef}
        className="w-full p-2 text-xs bg-transparent border-0 focus:outline-none text-gray-500 dark:text-gray-400 placeholder-gray-400 dark:placeholder-gray-500 resize-none overflow-hidden leading-relaxed"
        style={{ minHeight: "60px" }}
        value={memo}
        onChange={handleMemoChange}
        onBlur={handleSaveMemo}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSaveMemo();
          }
          if (e.key === "Escape") {
            handleCancelEdit();
          }
        }}
        placeholder="간단한 메모를 입력하세요... (Shift+Enter로 줄바꿈)"
        autoFocus
      />
    </div>
  );
}
