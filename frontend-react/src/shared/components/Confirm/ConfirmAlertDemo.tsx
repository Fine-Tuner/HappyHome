import React, { useState } from "react";
import ConfirmAlert, { AlertIconType } from "./ConfirmAlert";

export default function ConfirmAlertDemo() {
  const [currentDemo, setCurrentDemo] = useState<string | null>(null);

  const demos = [
    {
      id: "delete",
      title: "삭제 확인",
      iconType: "DELETE" as AlertIconType,
      dialogTitle: "파일 삭제",
      message: "정말로 이 파일을 삭제하시겠습니까?",
      description: "삭제된 파일은 복구할 수 없습니다.",
      confirmText: "삭제",
      cancelText: "취소",
    },
    {
      id: "warning",
      title: "경고",
      iconType: "WARNING" as AlertIconType,
      dialogTitle: "주의 필요",
      message: "이 작업은 되돌릴 수 없습니다.",
      description: "계속하기 전에 신중히 생각해보세요.",
      confirmText: "계속",
      cancelText: "취소",
    },
    {
      id: "success",
      title: "성공",
      iconType: "SUCCESS" as AlertIconType,
      dialogTitle: "작업 완료",
      message: "파일이 성공적으로 업로드되었습니다!",
      description: "이제 파일을 사용할 수 있습니다.",
      confirmText: "확인",
      cancelText: "닫기",
    },
    {
      id: "info",
      title: "정보",
      iconType: "INFO" as AlertIconType,
      dialogTitle: "알림",
      message: "새로운 업데이트가 있습니다.",
      description: "최신 버전으로 업데이트하시겠습니까?",
      confirmText: "업데이트",
      cancelText: "나중에",
    },
    {
      id: "error",
      title: "오류",
      iconType: "ERROR" as AlertIconType,
      dialogTitle: "오류 발생",
      message: "파일을 저장할 수 없습니다.",
      description: "네트워크 연결을 확인하고 다시 시도해주세요.",
      confirmText: "다시 시도",
      cancelText: "취소",
    },
    {
      id: "legacy",
      title: "기존 방식 (하위 호환)",
      iconType: undefined,
      dialogTitle: undefined,
      message: "기존 방식으로 사용",
      description: undefined,
      confirmText: undefined,
      cancelText: undefined,
      type: "category" as const,
    },
  ];

  const handleConfirm = (demoId: string) => {
    console.log(`${demoId} 확인됨`);
    setCurrentDemo(null);
  };

  const handleCancel = () => {
    console.log("취소됨");
    setCurrentDemo(null);
  };

  const currentDemoData = demos.find((demo) => demo.id === currentDemo);

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold mb-6">ConfirmAlert 컴포넌트 데모</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {demos.map((demo) => (
          <button
            key={demo.id}
            onClick={() => setCurrentDemo(demo.id)}
            className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="font-medium">{demo.title}</div>
            <div className="text-sm text-gray-500 mt-1">
              {demo.iconType || "Legacy"}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h3 className="font-medium mb-2">사용법:</h3>
        <pre className="text-sm overflow-x-auto">
          {`// 새로운 방식 (권장)
<ConfirmAlert
  isOpen={isOpen}
  iconType="SUCCESS"
  title="작업 완료"
  message="파일이 성공적으로 업로드되었습니다!"
  description="이제 파일을 사용할 수 있습니다."
  confirmButtonText="확인"
  cancelButtonText="닫기"
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>

// 기존 방식 (하위 호환)
<ConfirmAlert
  isOpen={isOpen}
  message="삭제하시겠습니까?"
  type="category"
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>`}
        </pre>
      </div>

      {currentDemoData && (
        <ConfirmAlert
          isOpen={true}
          iconType={currentDemoData.iconType}
          title={currentDemoData.dialogTitle}
          message={currentDemoData.message}
          description={currentDemoData.description}
          confirmButtonText={currentDemoData.confirmText}
          cancelButtonText={currentDemoData.cancelText}
          onConfirm={() => handleConfirm(currentDemo!)}
          onCancel={handleCancel}
          // @ts-ignore - 기존 방식 테스트용
          type={currentDemoData.type}
        />
      )}
    </div>
  );
}
