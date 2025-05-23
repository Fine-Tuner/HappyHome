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
    <div className="mt-10">
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
