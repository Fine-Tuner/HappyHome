import { useEffect, useRef, useState } from "react";

interface Props {
  containerRef: React.RefObject<HTMLDivElement | null>;
  pdfWidth: number;
  setPdfWidth: (width: number) => void;
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
}

export default function ResizeHandle({
  containerRef,
  pdfWidth,
  setPdfWidth,
  isDragging,
  setIsDragging,
}: Props) {
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = pdfWidth;
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const savedWidth = localStorage.getItem("pdfWidth");
    const initialWidth = savedWidth ? Number(savedWidth) : 2400;
    setPdfWidth(initialWidth);
  }, [containerRef.current]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - startXRef.current;
      const newWidth = startWidthRef.current + deltaX;

      const containerWidth = window.innerWidth;
      const minWidth = containerWidth * 0.3;
      const maxWidth = containerWidth * 0.75;

      if (newWidth < minWidth || newWidth > maxWidth) return;
      setPdfWidth(newWidth);
      localStorage.setItem("pdfWidth", newWidth.toString());
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("mouseleave", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mouseleave", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      className="absolute right-0 top-1/2 transform -translate-y-1/2 cursor-col-resize z-20 group"
      onMouseDown={handleMouseDown}
    >
      {/* 넓은 호버 영역 */}
      <div className="absolute -left-4 -right-4 -top-12 -bottom-12" />

      {/* 미니멀 플로팅 라인 */}
      <div className="relative flex items-center justify-center">
        {/* 메인 세로 바 */}
        <div
          className={`w-1 h-12 rounded-full transition-all duration-200 ease-out ${
            isDragging
              ? "bg-blue-500 dark:bg-blue-400 h-16 w-1.5"
              : "bg-gray-300 dark:bg-gray-500 group-hover:bg-blue-400 dark:group-hover:bg-blue-300 group-hover:h-14"
          }`}
          style={{
            boxShadow: isDragging
              ? "0 0 20px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.1)"
              : "none",
          }}
        />

        {/* 호버/드래그 시 나타나는 미세한 인디케이터 */}
        <div
          className={`absolute transition-all duration-200 ${
            isDragging
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 group-hover:opacity-60 group-hover:scale-100"
          }`}
        >
          <div className="flex items-center gap-0.5">
            <div className="w-0.5 h-3 bg-blue-400 dark:bg-blue-300 rounded-full opacity-40" />
            <div className="w-0.5 h-3 bg-blue-400 dark:bg-blue-300 rounded-full opacity-60" />
            <div className="w-0.5 h-3 bg-blue-400 dark:bg-blue-300 rounded-full opacity-40" />
          </div>
        </div>
      </div>
    </div>
  );
}
