import { useState } from "react";
import { Condition as ConditionType } from "../../announcement/api/getAnnouncement";

interface UseConditionListProps {
  localConditions: ConditionType[];
  iframeRef: React.RefObject<HTMLIFrameElement>;
}

export const useConditionList = ({ localConditions, iframeRef }: UseConditionListProps) => {
  const [hoveredCondition, setHoveredCondition] = useState<string | null>(null);
  const [editingCondition, setEditingCondition] = useState<string | null>(null);
  const [editedText, setEditedText] = useState<string>("");
  const [openMemo, setOpenMemo] = useState<string | null>(null);

  const handleEditStart = (conditionId: string, currentText: string) => {
    setEditingCondition(conditionId);
    setEditedText(currentText);
  };

  const handleEditSave = (conditionId: string) => {
    // TODO: API 호출로 업데이트
    console.log("Saving condition:", conditionId, editedText);
    setEditingCondition(null);
  };

  const handleEditCancel = () => {
    setEditingCondition(null);
    setEditedText("");
  };

  const handleDelete = (conditionId: string) => {
    // TODO: 삭제 확인 후 API 호출
    console.log("Deleting condition:", conditionId);
  };

  const handleMemo = (conditionId: string) => {
    setOpenMemo(openMemo === conditionId ? null : conditionId);
  };

  // PDF 페이지 크기 정보 가져오기
  const getPdfPageInfo = async (pageNumber: number, innerFrameWindow: any) => {
    try {
      const pdfApp = innerFrameWindow?.PDFViewerApplication;
      if (!pdfApp || !pdfApp.pdfDocument) {
        return null;
      }

      // 특정 페이지 정보 가져오기
      const page = await pdfApp.pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.0 });

      return {
        width: viewport.width,
        height: viewport.height,
        rotation: viewport.rotation
      };
    } catch (error) {
      return null;
    }
  };

  // PDF 위치 하이라이트 클릭 (bbox, page 기반)
  const handleHighlightClick = async (
    bbox: { x: number; y: number; width: number; height: number },
    pageNumber: number,
    index: number = 0,
  ) => {
    const innerFrame =
      iframeRef.current?.contentWindow?.document?.querySelector("iframe");
    if (!innerFrame) {
      return;
    }

    const innerFrameWindow = innerFrame.contentWindow;
    if (!innerFrameWindow) {
      return;
    }

    // PDF 페이지 크기 정보 동적 가져오기
    const pageInfo = await getPdfPageInfo(pageNumber, innerFrameWindow);
    const pageWidth = pageInfo?.width || 595; // 기본값 595
    const pageHeight = (pageInfo?.height || 840) - 16; // 기본값 840

    const { x, y, width, height } = bbox;
    // 좌측 하단 기준의 좌표를 좌측 상단 기준으로 변환
    const top = ((pageHeight - height) / pageHeight) * 100;
    const left = (x / pageWidth) * 100;
    const widthPercent = ((width - x) / pageWidth) * 100;
    const heightPercent = ((height - y) / pageHeight) * 100;

    const pageElement = innerFrameWindow?.document?.querySelector(
      `.page[data-page-number="${pageNumber}"]`,
    );
    if (!pageElement) {
      return;
    }

    // 새로운 하이라이트 추가 (고유 ID 사용)
    const highlightLayer = document.createElement("div");
    highlightLayer.id = `highlight-layer-${index}`;
    highlightLayer.style.position = "absolute";
    highlightLayer.style.left = `${left}%`;
    highlightLayer.style.top = `${top}%`;
    highlightLayer.style.width = `${widthPercent}%`;
    highlightLayer.style.height = `${heightPercent}%`;
    highlightLayer.style.backgroundColor = "rgba(20, 184, 166, 0.3)"; // teal 색상
    highlightLayer.style.border = "2px solid rgba(20, 184, 166, 0.6)";
    highlightLayer.style.borderRadius = "3px";
    highlightLayer.style.boxShadow = "0 0 10px rgba(20, 184, 166, 0.4)";
    highlightLayer.style.pointerEvents = "none"; // 클릭 이벤트 방지
    highlightLayer.classList.add("highlight-overlay");
    pageElement.appendChild(highlightLayer);

    // 3초 후 하이라이트 제거
    setTimeout(() => {
      highlightLayer.remove();
    }, 3000);

    // 첫 번째 하이라이트일 때만 스크롤 (여러 하이라이트 중 한 번만)
    if (index === 0) {
      pageElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleConditionClick = (condition: ConditionType) => {
    if (!iframeRef.current?.contentWindow) {
      return;
    }

    try {
      // 기존 모든 하이라이트 제거
      const innerFrame =
        iframeRef.current?.contentWindow?.document?.querySelector("iframe");
      if (innerFrame?.contentWindow) {
        const existingHighlights =
          innerFrame.contentWindow.document.querySelectorAll(".highlight-overlay");
        existingHighlights.forEach((el) => el.remove());
      }

      const conditionPosition = condition.position as any;

      // position.rects에서 모든 rect 가져오기 (여러 줄 어노테이션 지원)
      if (!conditionPosition?.rects || conditionPosition.rects.length === 0) {
        return;
      }

      // pageIndex 또는 pageLabel을 사용해서 pageNumber 계산
      let pageNumber: number;
      if (conditionPosition.pageIndex !== undefined && conditionPosition.pageIndex >= 0) {
        pageNumber = conditionPosition.pageIndex + 1;
      } else if (condition.pageLabel) {
        // pageLabel을 숫자로 변환 (예: "1" → 1)
        pageNumber = parseInt(condition.pageLabel) || 1;
      } else {
        pageNumber = 1;
      }

      // 모든 rect에 대해 하이라이트 실행
      conditionPosition.rects.forEach((rect: number[], index: number) => {
        if (!Array.isArray(rect) || rect.length < 4) {
          return;
        }

        // [x1, y1, x2, y2] 형태를 { x, y, width, height } 형태로 변환
        const [x1, y1, x2, y2] = rect;
        const bbox = {
          x: Math.min(x1, x2),
          y: Math.min(y1, y2),
          width: Math.max(x1, x2),
          height: Math.max(y1, y2)
        };

        // 각 rect마다 약간의 지연을 두어 자연스럽게 표시
        setTimeout(() => {
          handleHighlightClick(bbox, pageNumber, index);
        }, index * 50); // 50ms씩 지연
      });

    } catch (error) {
      console.error("Condition 클릭 처리 중 오류:", error);
    }
  };

  return {
    // 상태
    hoveredCondition,
    setHoveredCondition,
    editingCondition,
    editedText,
    setEditedText,
    openMemo,
    setOpenMemo,

    // 핸들러들
    handleEditStart,
    handleEditSave,
    handleEditCancel,
    handleDelete,
    handleMemo,
    handleConditionClick,
  };
};
