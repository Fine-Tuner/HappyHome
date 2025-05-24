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
      className={`absolute right-0 top-0 h-full w-2 cursor-col-resize transition-colors duration-150 z-10 ${
        isDragging
          ? "bg-blue-500 dark:bg-blue-600"
          : "bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-600"
      }`}
      style={{ left: `${pdfWidth}px` }}
      onMouseDown={handleMouseDown}
    />
  );
}
