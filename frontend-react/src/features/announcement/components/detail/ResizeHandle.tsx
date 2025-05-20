import { useEffect, useRef, useState } from "react";

interface Props {
  containerRef: React.RefObject<HTMLDivElement | null>;
  pdfWidth: number;
  setPdfWidth: (width: number) => void;
}

export default function ResizeHandle({
  containerRef,
  pdfWidth,
  setPdfWidth,
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = pdfWidth;
  };

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;

      const containerWidth = window.innerWidth;
      const minWidth = containerWidth * 0.5;
      const maxWidth = containerWidth * 0.85;

      if (pdfWidth < minWidth) {
        setPdfWidth(minWidth);
        localStorage.setItem("pdfWidth", minWidth.toString());
      } else if (pdfWidth > maxWidth) {
        setPdfWidth(maxWidth);
        localStorage.setItem("pdfWidth", maxWidth.toString());
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      const maxWidth = containerWidth * 0.85;

      if (newWidth < minWidth || newWidth > maxWidth) return;
      setPdfWidth(newWidth);
      localStorage.setItem("pdfWidth", newWidth.toString());
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("mouseleave", handleMouseUp);
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseUp);
      document.body.style.userSelect = "";
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
