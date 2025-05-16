import { Announcement } from "../../api/get/announcements";

function getStatus(announcement: Announcement) {
  const today = new Date();
  const announcementDate = new Date(announcement.announcementDate);
  const applicationStartDate = new Date(announcement.applicationStartDate);
  const applicationEndDate = new Date(announcement.applicationEndDate);

  if (today >= announcementDate && today < applicationStartDate) {
    return "공고중";
  }
  if (today >= applicationStartDate && today <= applicationEndDate) {
    return "접수중";
  }
  if (today > applicationEndDate) {
    return "모집완료";
  }
  return "공고중";
}

function getViewCountColor(viewCount: number, isCompleted: boolean) {
  if (isCompleted) {
    return "text-gray-400 dark:text-gray-500";
  }
  if (viewCount >= 1000) {
    return "text-orange-500 dark:text-orange-400";
  }
  return "text-gray-900 dark:text-gray-100";
}

const shimmerAnimation = `
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.animate-shimmer {
  background-size: 200% 100%;
  animation: shimmer 2s infinite linear;
}

@keyframes bgPulse {
  0% {
    background-color: rgba(59, 130, 246, 0.05);
  }
  50% {
    background-color: rgba(59, 130, 246, 0.1);
  }
  100% {
    background-color: rgba(59, 130, 246, 0.05);
  }
}

.animate-bg-pulse {
  animation: bgPulse 4s infinite;
}
`;

export { getStatus, getViewCountColor, shimmerAnimation };
