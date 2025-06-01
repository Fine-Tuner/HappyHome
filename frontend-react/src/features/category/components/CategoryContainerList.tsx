import CategoryContainer from "./CategoryContainer";
import { useGetAnnouncement } from "../../announcement/api/getAnnouncement";
import { useParams } from "react-router-dom";

interface Props {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  expandedCategories: Record<string, boolean>;
  onToggleCategory: (categoryId: string) => void;
}

export default function CategoryContainerList({
  iframeRef,
  expandedCategories,
  onToggleCategory,
}: Props) {
  const params = useParams();
  const { data: announcementDetailData } = useGetAnnouncement({
    params: { announcementId: params.id! },
  });

  return (
    <div className="mt-4">
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
            onToggleCategory={onToggleCategory}
          />
        );
      })}
    </div>
  );
}
