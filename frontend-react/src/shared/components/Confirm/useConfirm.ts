import { useState } from "react";

export const useConfirm = () => {
  // 알럿창 상태 관리
  const [alertState, setAlertState] = useState({
    isOpen: false,
    message: "",
    confirmAction: () => {},
    buttonLabel: "",
  });

  // 알럿창 열기
  const openConfirmAlert = (
    message: string,
    confirmAction: () => void,
    buttonLabel: string,
  ) => {
    setAlertState({
      isOpen: true,
      message,
      confirmAction,
      buttonLabel,
    });
  };

  // 알럿창 닫기
  const closeConfirmAlert = () => {
    setAlertState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  };

  // 확인 버튼 클릭 시
  const handleConfirm = () => {
    alertState.confirmAction();
    closeConfirmAlert();
  };

  return {
    alertState,
    openConfirmAlert,
    closeConfirmAlert,
    handleConfirm,
  };
};
