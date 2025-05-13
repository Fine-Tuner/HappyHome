import { Announcement } from "../../types/announcement";
import { useNavigate } from "react-router-dom";

interface AnnouncementCardProps {
  announcement: Announcement;
  currentPage: number;
  numPages: number;
  onLoadSuccess: (announcementId: string, numPages: number) => void;
  onPageChange: (announcementId: string, direction: "prev" | "next") => void;
  onPdfClick: (pdfUrl: string) => void;
}

export default function AnnouncementCard({
  announcement,
  currentPage,
  numPages,
  onLoadSuccess,
  onPageChange,
  onPdfClick,
}: AnnouncementCardProps) {
  const navigate = useNavigate();

  const handleCardClick = (e: React.MouseEvent) => {
    // PDF 미리보기나 다운로드 버튼 클릭 시에는 상세 페이지로 이동하지 않음
    const target = e.target as HTMLElement;
    if (target.closest(".pdf-preview") || target.closest(".pdf-download")) {
      return;
    }
    navigate(`/announcements/${announcement.id}`);
  };

  const handlePdfClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 이벤트 전파 중단
    onPdfClick(announcement.pdfUrl);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative p-6 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-200 ease-out hover:scale-[1.01] hover:border-blue-200/50 dark:hover:border-blue-400/50 flex gap-6 backdrop-blur-sm overflow-hidden cursor-pointer"
    >
      {/* 그라데이션 오버레이 - pointer-events-none 추가 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-purple-50/10 to-pink-50/5 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" />

      {/* 애니메이션 효과를 위한 요소 - pointer-events-none 추가 */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-gray-700/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-300 ease-out pointer-events-none" />

      <div className="w-48 flex flex-col gap-2 relative z-10">
        <div className="pdf-preview" onClick={handlePdfClick}>
          {/* PDF 미리보기 컴포넌트는 나중에 구현 */}
          <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <span className="text-gray-500 dark:text-gray-400">
              PDF 미리보기
            </span>
          </div>
        </div>
        <button
          className="pdf-download w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            window.open(announcement.pdfUrl, "_blank");
          }}
        >
          PDF 다운로드
        </button>
      </div>

      <div className="flex-1 relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
              {announcement.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
              {announcement.location}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col">
            <span className="text-gray-500 dark:text-gray-400">공급대상</span>
            <span className="text-gray-700 dark:text-gray-300">
              {announcement.targetGroup}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 dark:text-gray-400">모집위치</span>
            <span className="text-gray-700 dark:text-gray-300">
              {announcement.location}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 dark:text-gray-400">
              모집 세대수
            </span>
            <span className="text-gray-700 dark:text-gray-300">
              {announcement.households}세대
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 dark:text-gray-400">전용면적</span>
            <span className="text-gray-700 dark:text-gray-300">
              {announcement.floorArea}㎡
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 dark:text-gray-400">임대기간</span>
            <span className="text-gray-700 dark:text-gray-300">
              {announcement.leasePeriod}년
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 dark:text-gray-400">건물종류</span>
            <span className="text-gray-700 dark:text-gray-300">
              {announcement.buildingType}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
