import CategoryContainer from "./CategoryContainer";
import { useGetAnnouncement } from "../../announcement/api/getAnnouncement";
import { useParams } from "react-router-dom";

interface Props {
  iframeRef: React.RefObject<HTMLIFrameElement>;
}

export default function CategoryContainerList({ iframeRef }: Props) {
  const params = useParams();
  const { data: announcementDetailData } = useGetAnnouncement({
    params: { announcementId: params.id! },
  });

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
          />
        );
      })}
    </div>
  );
}
