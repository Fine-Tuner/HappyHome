import { useState, useEffect } from "react";
import { ContentItem } from "../types/announcementDetail";

export const useContent = () => {
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>(
    {},
  );
  const [expandedContents, setExpandedContents] = useState<
    Record<string, boolean>
  >({});
  const [editedContents, setEditedContents] = useState<Record<string, string>>(
    {},
  );
  const [contentAnnotations, setContentAnnotations] = useState<{
    [key: string]: any[];
  }>({});

  useEffect(() => {
    const savedContents = localStorage.getItem("editedContents");
    if (savedContents) {
      setEditedContents(JSON.parse(savedContents));
    }
  }, []);

  const toggleTopic = (topicId: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicId]: !prev[topicId],
    }));
  };

  const toggleContent = (topicId: string, contentIndex: number) => {
    const key = `${topicId}-${contentIndex}`;
    setExpandedContents((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleContentEdit = (
    topicId: string,
    content: ContentItem,
    newContent: string,
  ) => {
    const contentId = `${topicId}-${content.content}`;
    const updatedContents = {
      ...editedContents,
      [contentId]: newContent,
    };
    setEditedContents(updatedContents);
    localStorage.setItem("editedContents", JSON.stringify(updatedContents));
  };

  const handleResetContent = (topicId: string, content: ContentItem) => {
    const contentId = `${topicId}-${content.content}`;
    const updatedContents = { ...editedContents };
    delete updatedContents[contentId];
    setEditedContents(updatedContents);
    localStorage.setItem("editedContents", JSON.stringify(updatedContents));
  };

  const onSaveAnnotations = async (annotations: any[]) => {
    setContentAnnotations((prevAnnotations) => {
      const updatedAnnotations = { ...prevAnnotations };

      annotations.forEach((annotation) => {
        if (annotation.contentId) {
          const contentKey = annotation.contentId;

          if (!updatedAnnotations[contentKey]) {
            updatedAnnotations[contentKey] = [];
          }

          const existingIndex = updatedAnnotations[contentKey].findIndex(
            (a) => a.id === annotation.id,
          );

          if (existingIndex !== -1) {
            updatedAnnotations[contentKey][existingIndex] = annotation;
          } else {
            updatedAnnotations[contentKey] = [
              ...updatedAnnotations[contentKey],
              annotation,
            ];
          }
        }
      });

      return updatedAnnotations;
    });
  };

  return {
    expandedTopics,
    expandedContents,
    editedContents,
    contentAnnotations,
    toggleTopic,
    toggleContent,
    handleContentEdit,
    handleResetContent,
    onSaveAnnotations,
  };
};
