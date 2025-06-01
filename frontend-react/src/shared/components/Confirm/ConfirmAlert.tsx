import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type AlertIconType = "DELETE" | "WARNING" | "SUCCESS" | "INFO" | "ERROR";

interface ConfirmAlertProps {
  isOpen: boolean;
  iconType?: AlertIconType;
  title?: string;
  message?: string;
  description?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  // 하위 호환성을 위한 기존 props
  type?: "category" | "condition";
  buttonLabel?: string;
}

const ConfirmAlert = ({
  isOpen,
  iconType = "DELETE",
  title,
  message,
  description,
  confirmButtonText,
  cancelButtonText = "취소",
  onConfirm,
  onCancel,
  // 하위 호환성을 위한 기존 props
  type,
  buttonLabel,
}: ConfirmAlertProps) => {
  // 테마 감지
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      // 1. HTML 클래스 확인
      const isDarkClass = document.documentElement.classList.contains("dark");
      // 2. CSS 변수나 data 속성 확인
      const isDarkData =
        document.documentElement.getAttribute("data-theme") === "dark";
      // 3. 시스템 테마 확인
      const isDarkSystem = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;

      setIsDark(isDarkClass || isDarkData || isDarkSystem);
    };

    checkTheme();

    // 시스템 테마 변경 감지
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", checkTheme);

    // DOM 변경 감지 (클래스 변경)
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    return () => {
      mediaQuery.removeEventListener("change", checkTheme);
      observer.disconnect();
    };
  }, []);

  // ESC 키 처리
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
      // 스크롤 방지
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  // 배경 클릭 시 닫기
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  // 아이콘 타입별 설정
  const getIconConfig = () => {
    switch (iconType) {
      case "DELETE":
        return {
          icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M3 7H21M7 7L9 3H15L17 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          ),
          color: "#ef4444", // red-500
          bgColor: "rgba(239, 68, 68, 0.1)",
        };
      case "WARNING":
        return {
          icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18A2 2 0 003.24 21H20.76A2 2 0 0022.18 18L13.71 3.86A2 2 0 0010.29 3.86Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          ),
          color: "#f59e0b", // amber-500
          bgColor: "rgba(245, 158, 11, 0.1)",
        };
      case "SUCCESS":
        return {
          icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          ),
          color: "#10b981", // emerald-500
          bgColor: "rgba(16, 185, 129, 0.1)",
        };
      case "INFO":
        return {
          icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          ),
          color: "#3b82f6", // blue-500
          bgColor: "rgba(59, 130, 246, 0.1)",
        };
      case "ERROR":
        return {
          icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M10 14L12 12M12 12L14 10M12 12L10 10M12 12L14 14M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          ),
          color: "#dc2626", // red-600
          bgColor: "rgba(220, 38, 38, 0.1)",
        };
      default:
        return getIconConfig(); // DEFAULT는 DELETE와 동일
    }
  };

  // 하위 호환성을 위한 type 기반 기본값 설정
  const getFallbackContent = () => {
    if (type === "category") {
      return {
        title: "카테고리 삭제",
        message: "이 카테고리를 삭제하시겠습니까?",
        description: "카테고리 내의 모든 항목도 함께 삭제됩니다.",
        confirmButtonText: "삭제",
      };
    } else if (type === "condition") {
      return {
        title: "항목 삭제",
        message: "이 항목을 삭제하시겠습니까?",
        description: "삭제된 항목은 복구할 수 없습니다.",
        confirmButtonText: "삭제",
      };
    }
    return {
      title: "확인",
      message: "계속하시겠습니까?",
      description: "",
      confirmButtonText: "확인",
    };
  };

  const fallbackContent = getFallbackContent();
  const iconConfig = getIconConfig();

  // 최종 표시될 내용 결정 (prop > fallback 순서)
  const finalTitle = title || fallbackContent.title;
  const finalMessage = message || fallbackContent.message;
  const finalDescription = description || fallbackContent.description;
  const finalConfirmText =
    confirmButtonText || buttonLabel || fallbackContent.confirmButtonText;

  // 테마별 색상 정의
  const colors = isDark
    ? {
        // 다크 테마 - Teal 계열
        background: "#1f2937",
        border: "#374151",
        text: "#f9fafb",
        textSecondary: "#d1d5db",
        cancelBg: "#374151",
        cancelBgHover: "#4b5563",
        cancelText: "#d1d5db",
        confirmBg: "#14b8a6", // teal-500
        confirmBgHover: "#0d9488", // teal-600
        confirmText: "#ffffff",
        overlay: "rgba(0, 0, 0, 0.7)",
      }
    : {
        // 라이트 테마 - 모던 블루/그레이 계열
        background: "#ffffff",
        border: "#e5e7eb",
        text: "#111827",
        textSecondary: "#6b7280",
        cancelBg: "#f3f4f6",
        cancelBgHover: "#e5e7eb",
        cancelText: "#374151",
        confirmBg: "#3b82f6", // blue-500
        confirmBgHover: "#2563eb", // blue-600
        confirmText: "#ffffff",
        overlay: "rgba(0, 0, 0, 0.4)",
      };

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.overlay,
    backdropFilter: "blur(8px)",
    animation: "fadeIn 0.2s ease-out",
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: "16px",
    padding: "32px",
    maxWidth: "420px",
    width: "90%",
    boxShadow: isDark
      ? "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)"
      : "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
    transform: "scale(1)",
    transition: "all 0.2s ease-out",
    animation: "modalSlideIn 0.3s ease-out",
  };

  const iconStyle: React.CSSProperties = {
    width: "48px",
    height: "48px",
    margin: "0 auto 20px",
    borderRadius: "50%",
    backgroundColor: iconConfig.bgColor,
    border: `2px solid ${iconConfig.color}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: iconConfig.color,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: "600",
    marginBottom: "8px",
    textAlign: "center",
    color: colors.text,
    lineHeight: "1.4",
  };

  const messageStyle: React.CSSProperties = {
    fontSize: "16px",
    marginBottom: finalDescription ? "8px" : "32px",
    textAlign: "center",
    color: colors.text,
    lineHeight: "1.5",
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: "14px",
    marginBottom: "32px",
    textAlign: "center",
    color: colors.textSecondary,
    lineHeight: "1.5",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "12px 24px",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "600",
    border: "none",
    cursor: "pointer",
    minWidth: "100px",
    transition: "all 0.2s ease-out",
    position: "relative",
    overflow: "hidden",
  };

  const cancelButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: colors.cancelBg,
    color: colors.cancelText,
    marginRight: "16px",
    border: `1px solid ${colors.border}`,
  };

  const confirmButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: colors.confirmBg,
    color: colors.confirmText,
    boxShadow: isDark
      ? "0 2px 8px rgba(20, 184, 166, 0.25)"
      : "0 2px 8px rgba(59, 130, 246, 0.25)",
  };

  const modalContent = (
    <div style={overlayStyle} onClick={handleBackgroundClick}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* 아이콘 */}
        <div style={iconStyle}>{iconConfig.icon}</div>

        {/* 제목 */}
        <div style={titleStyle}>{finalTitle}</div>

        {/* 메시지 */}
        <div style={messageStyle}>{finalMessage}</div>

        {/* 설명 (있는 경우에만) */}
        {finalDescription && (
          <div style={descriptionStyle}>{finalDescription}</div>
        )}

        {/* 버튼들 */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
            <button
              onClick={onCancel}
            style={cancelButtonStyle}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = colors.cancelBgHover;
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = colors.cancelBg;
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {cancelButtonText}
            </button>
            <button
              onClick={onConfirm}
            style={confirmButtonStyle}
            autoFocus
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = colors.confirmBgHover;
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = isDark
                ? "0 4px 16px rgba(20, 184, 166, 0.4)"
                : "0 4px 16px rgba(59, 130, 246, 0.4)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = colors.confirmBg;
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = isDark
                ? "0 2px 8px rgba(20, 184, 166, 0.25)"
                : "0 2px 8px rgba(59, 130, 246, 0.25)";
            }}
          >
            {finalConfirmText}
            </button>
        </div>
      </div>

      {/* 키프레임 애니메이션 */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );

  // Portal을 사용하여 body에 직접 렌더링
  return createPortal(modalContent, document.body);
};

export default ConfirmAlert;
