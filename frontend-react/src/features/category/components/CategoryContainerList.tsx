import CategoryContainer from "./CategoryContainer";
import { useGetAnnouncement } from "../../announcement/api/getAnnouncement";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

interface Props {
  iframeRef: React.RefObject<HTMLIFrameElement>;
}

// localStorage 키 상수
const EXPANDED_CATEGORIES_KEY = "happyhome_expanded_categories";

// localStorage에서 카테고리 펼침 상태 가져오기
const getExpandedCategoriesFromStorage = (): Record<string, boolean> => {
  try {
    const stored = localStorage.getItem(EXPANDED_CATEGORIES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error(
      "Failed to parse expanded categories from localStorage:",
      error,
    );
    return {};
  }
};

// localStorage에 카테고리 펼침 상태 저장하기
const saveExpandedCategoriesToStorage = (
  expandedCategories: Record<string, boolean>,
) => {
  try {
    localStorage.setItem(
      EXPANDED_CATEGORIES_KEY,
      JSON.stringify(expandedCategories),
    );
  } catch (error) {
    console.error("Failed to save expanded categories to localStorage:", error);
  }
};

export default function CategoryContainerList({ iframeRef }: Props) {
  const params = useParams();
  const { data: announcementDetailData } = useGetAnnouncement({
    params: { announcementId: params.id! },
  });

  // 전체 카테고리의 펼침/접힘 상태 관리
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >(() => {
    return getExpandedCategoriesFromStorage();
  });

  // expandedCategories가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    saveExpandedCategoriesToStorage(expandedCategories);
  }, [expandedCategories]);

  // 카테고리 토글 핸들러
  const handleToggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId], // 기본값은 false (접힌 상태)
    }));
  };

  return (
    <div className="mt-4">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          요약정보
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          공고문의 핵심 내용을 요약했습니다. 자유롭게 편집하고 메모를 추가할 수
          있습니다.
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          모든 내용은 개인적으로 저장됩니다.
        </p>
      </div>
      {announcementDetailData?.categories.map((category) => {
        // 조건 필터링 로직 개선: id와 original_id 둘 다 확인
        const conditions = (announcementDetailData.conditions || []).filter(
          (condition) =>
            condition.category_id === category.id ||
            condition.category_id === category.original_id,
        );

        return (
          <CategoryContainer
            key={category.id}
            category={{
              ...category,
              conditions,
            }}
            iframeRef={iframeRef}
            expandedCategories={expandedCategories}
            onToggleCategory={handleToggleCategory}
          />
        );
      })}
    </div>
  );
}
