import { useState } from "react";
import { GetAnnouncementResponse } from "../../api/getAnnouncement";
import { Announcement } from "../../types/announcement";
import Category from "./Category";

interface Props {
  announcementDetailData: GetAnnouncementResponse;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

export default function CategoryList({
  announcementDetailData,
  iframeRef,
}: Props) {
  // CategoryList 렌더링에 필요한 최소 상태 및 핸들러
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const [expandedConditions, setExpandedConditions] = useState<
    Record<string, boolean>
  >({});
  const [editedConditions, setEditedConditions] = useState<
    Record<string, string>
  >({});

  // 카테고리(구 Topic) 확장/축소 토글
  const handleToggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // 컨디션(구 Contents) 확장/축소 토글
  const handleToggleCondition = (
    categoryId: string,
    conditionIndex: number,
  ) => {
    const key = `${categoryId}-${conditionIndex}`;
    setExpandedConditions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 컨디션 편집
  const handleConditionEdit = (
    categoryId: string,
    condition: any,
    newCondition: string,
  ) => {
    const key = `${categoryId}-${condition.text}`;
    setEditedConditions((prev) => ({ ...prev, [key]: newCondition }));
  };

  // 컨디션 리셋
  const handleResetCondition = (categoryId: string, condition: any) => {
    const key = `${categoryId}-${condition.text}`;
    setEditedConditions((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const handleHighlightClick = (
    bbox: { x: number; y: number; width: number; height: number },
    pageNumber: number,
  ) => {
    const innerFrame =
      iframeRef?.current?.contentWindow?.document?.querySelector("iframe");
    if (!innerFrame) return;
    const innerFrameWindow = innerFrame.contentWindow;

    const pageWidth = 595;
    const pageHeight = 840;

    const { x, y, width, height } = bbox;
    // 좌측 하단 기준의 좌표를 좌측 상단 기준으로 변환
    const top = ((pageHeight - height) / pageHeight) * 100;
    const left = (x / pageWidth) * 100;
    const widthPercent = ((width - x) / pageWidth) * 100;
    const heightPercent = ((height - y) / pageHeight) * 100;

    const pageElement = innerFrameWindow?.document?.querySelector(
      `.page[data-page-number="${pageNumber}"]`,
    );
    if (!pageElement) return;

    // 기존 하이라이트 제거
    const existingHighlights =
      pageElement.querySelectorAll(".highlight-overlay");
    existingHighlights.forEach((el) => el.remove());

    // 새로운 하이라이트 추가
    const highlightLayer = document.createElement("div");
    highlightLayer.id = "highlight-layer";
    highlightLayer.style.position = "absolute";
    highlightLayer.style.left = `${left}%`;
    highlightLayer.style.top = `${top}%`;
    highlightLayer.style.width = `${widthPercent}%`;
    highlightLayer.style.height = `${heightPercent}%`;
    highlightLayer.style.backgroundColor = "rgba(255, 255, 0, 0.3)";
    highlightLayer.classList.add("highlight-overlay");
    pageElement.appendChild(highlightLayer);

    // 3초 후 하이라이트 제거
    setTimeout(() => {
      highlightLayer.remove();
    }, 3000);

    // 해당 페이지로 스크롤
    pageElement.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <>
      {announcementDetailData?.categories.map((category) => {
        const conditions = (announcementDetailData.conditions || []).filter(
          (ann) => ann.category_id === category.id,
        );

        return (
          <Category
            key={category.id}
            category={{
              id: category.id,
              name: category.name,
              conditions,
            }}
            expandedCategories={expandedCategories}
            expandedConditions={expandedConditions}
            editedConditions={editedConditions}
            conditionAnnotations={{}}
            comments={{}}
            newComment={{}}
            onToggleCategory={handleToggleCategory}
            onToggleCondition={handleToggleCondition}
            onConditionEdit={handleConditionEdit}
            onResetCondition={handleResetCondition}
            onHighlightClick={handleHighlightClick}
            onAddComment={() => {}}
            onDeleteComment={() => {}}
            onNewCommentChange={() => {}}
            onAnnotationClick={() => {}}
          />
        );
      })}
    </>
  );
}
