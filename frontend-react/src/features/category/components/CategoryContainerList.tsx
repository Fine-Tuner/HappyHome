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
          공고문의 핵심 내용을 요약했습니다. 원하는 대로 편집하고 메모를 추가할
          수 있습니다.
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          수정이나 메모는 개인적으로 저장됩니다.
        </p>
      </div>
      {announcementDetailData?.categories.map((category) => {
        const conditions = (announcementDetailData.conditions || []).filter(
          (condition) => condition.category_id === category.id,
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
