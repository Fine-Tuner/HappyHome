import React from "react";

interface ConfirmAlertProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  buttonLabel?: string;
}

const ConfirmAlert = ({
  isOpen,
  message,
  onConfirm,
  onCancel,
  buttonLabel = "삭제",
}: ConfirmAlertProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fadeIn">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-w-md w-full mx-4 overflow-hidden animate-scaleIn">
        <div className="p-5">
          <div className="text-white text-base mb-5">{message}</div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition"
            >
              취소
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            >
              {buttonLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmAlert;
