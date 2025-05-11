import { Link } from "react-router-dom";
import { Announcement } from "../types/announcement";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { AnnouncementFilter } from "../types/announcement";
import { useState } from "react";
import { Tooltip } from "react-tooltip";

const SORT_OPTIONS = [
  { value: "latest", label: "최신순" },
  { value: "views", label: "조회순" },
];

const STATUS_OPTIONS = [
  { value: "공고중", label: "공고중" },
  { value: "접수중", label: "접수중" },
  { value: "모집완료", label: "모집완료" },
];

function SortToggle({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {SORT_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`px-2 py-1 text-xs font-medium transition
            ${
              value === opt.value
                ? "bg-blue-500 text-white"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            }
            ${opt.value === "latest" ? "rounded-l-lg" : ""} ${opt.value === "views" ? "rounded-r-lg" : ""}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function StatusMultiToggle({
  value,
  onChange,
}: {
  value: string[];
  onChange: (val: string[]) => void;
}) {
  const handleToggle = (status: string) => {
    if (value.includes(status)) {
      onChange(value.filter((v) => v !== status));
    } else {
      onChange([...value, status]);
    }
  };
  return (
    <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mr-2">
      {STATUS_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`px-2 py-1 text-xs font-medium transition
            ${
              value.includes(opt.value)
                ? "bg-blue-500 text-white"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            }
            ${opt.value === "공고중" ? "rounded-l-lg" : ""} ${opt.value === "모집완료" ? "rounded-r-lg" : ""}`}
          onClick={() => handleToggle(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

interface AnnouncementListProps {
  filters: AnnouncementFilter;
  sort: string;
  onSortChange: (sort: string) => void;
}

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

function TruncatedCell({
  content,
  maxLength = 20,
}: {
  content: string | string[] | number;
  maxLength?: number;
}) {
  const displayContent = Array.isArray(content)
    ? content.join(", ")
    : typeof content === "number"
      ? content.toString()
      : content;

  const isTruncated = displayContent.length > maxLength;
  const truncatedContent = isTruncated
    ? `${displayContent.slice(0, maxLength)}...`
    : displayContent;

  return (
    <div className="overflow-hidden">
      <span
        data-tooltip-id={isTruncated ? `tooltip-${displayContent}` : undefined}
        className="truncate block"
      >
        {truncatedContent}
      </span>
      {isTruncated && (
        <Tooltip
          id={`tooltip-${displayContent}`}
          place="top"
          content={displayContent}
          className="z-50"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "14px",
            maxWidth: "300px",
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
          }}
        />
      )}
    </div>
  );
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

export default function AnnouncementList({
  filters,
  sort,
  onSortChange,
}: AnnouncementListProps) {
  const { data } = useQuery({
    queryKey: ["announcements", filters],
    queryFn: () => api.getAnnouncements(filters),
  });

  const announcements = data?.items || [];
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Announcement;
    direction: "asc" | "desc";
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string[]>([
    "공고중",
    "접수중",
    "모집완료",
  ]);

  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (!sortConfig) return 0;

    const { key, direction } = sortConfig;
    if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
    if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
    return 0;
  });

  const requestSort = (key: keyof Announcement) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  return (
    <>
      <style>{shimmerAnimation}</style>
      <div className="flex justify-start items-center gap-2 mb-4">
        <StatusMultiToggle value={statusFilter} onChange={setStatusFilter} />
        <SortToggle value={sort} onChange={onSortChange} />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden border-collapse">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap">
                상태
              </th>
              <th
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                onClick={() => requestSort("address")}
              >
                위치
              </th>
              <th
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                onClick={() => requestSort("announcementName")}
              >
                공고명
              </th>
              <th
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                onClick={() => requestSort("suplyType")}
              >
                임대종류
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap">
                주택유형
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap">
                입주대상
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 whitespace-nowrap">
                전용면적
              </th>
              <th
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                onClick={() => requestSort("totalHouseholds")}
              >
                모집세대수
              </th>
              <th
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer border-r border-gray-200 dark:border-gray-600 w-24 whitespace-nowrap"
                onClick={() => requestSort("announcementDate")}
              >
                공고일
              </th>
              <th
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer border-r border-gray-200 dark:border-gray-600 whitespace-nowrap"
                onClick={() => requestSort("applicationStartDate")}
              >
                신청기간
              </th>
              <th
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer border-r border-gray-200 dark:border-gray-600 w-24 whitespace-nowrap"
                onClick={() => requestSort("moveInDate")}
              >
                입주예정일
              </th>
              <th
                className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer w-16 whitespace-nowrap"
                onClick={() => requestSort("viewCount")}
              >
                조회수
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedAnnouncements.map((announcement: Announcement) => {
              const status = getStatus(announcement);
              const isCompleted = status === "모집완료";
              const activeTextClass = isCompleted ? "" : "dark:text-white";
              return (
                <tr
                  key={announcement.sn}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    isCompleted
                      ? "text-gray-400 dark:text-gray-500"
                      : status === "접수중"
                        ? "animate-bg-pulse"
                        : ""
                  }`}
                >
                  <td className="px-3 py-2 whitespace-nowrap text-xs border-r border-gray-200 dark:border-gray-600">
                    <div className="flex justify-center">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          status === "공고중"
                            ? "bg-green-50 text-green-700"
                            : status === "접수중"
                              ? "relative overflow-hidden bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 text-white animate-shimmer"
                              : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                  </td>
                  <td
                    className={`px-3 py-2 whitespace-nowrap text-xs border-r border-gray-200 dark:border-gray-600 ${activeTextClass}`}
                  >
                    <TruncatedCell
                      content={announcement.address || "없음"}
                      maxLength={15}
                    />
                  </td>
                  <td
                    className={`px-3 py-2 whitespace-nowrap text-xs border-r border-gray-200 dark:border-gray-600 ${activeTextClass}`}
                  >
                    <Link
                      to={`/announcements/${announcement.sn}`}
                      className={`${isCompleted ? "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" : "text-blue-600 dark:text-blue-400 hover:underline"}`}
                    >
                      <TruncatedCell
                        content={announcement.announcementName || "없음"}
                        maxLength={40}
                      />
                    </Link>
                  </td>
                  <td
                    className={`px-3 py-2 whitespace-nowrap text-xs border-r border-gray-200 dark:border-gray-600 ${activeTextClass}`}
                  >
                    <TruncatedCell
                      content={announcement.suplyType || "없음"}
                      maxLength={10}
                    />
                  </td>
                  <td
                    className={`px-3 py-2 whitespace-nowrap text-xs border-r border-gray-200 dark:border-gray-600 ${activeTextClass}`}
                  >
                    <TruncatedCell
                      content={announcement.houseType || ["없음"]}
                      maxLength={15}
                    />
                  </td>
                  <td
                    className={`px-3 py-2 whitespace-nowrap text-xs border-r border-gray-200 dark:border-gray-600 ${activeTextClass}`}
                  >
                    <TruncatedCell
                      content={announcement.targetGroup || ["없음"]}
                      maxLength={15}
                    />
                  </td>
                  <td
                    className={`px-3 py-2 whitespace-nowrap text-xs border-r border-gray-200 dark:border-gray-600 ${activeTextClass}`}
                  >
                    <TruncatedCell
                      content={
                        announcement.area
                          ? announcement.area.map((area) => `${area}㎡`)
                          : ["없음"]
                      }
                      maxLength={15}
                    />
                  </td>
                  <td
                    className={`px-3 py-2 whitespace-nowrap text-xs border-r border-gray-200 dark:border-gray-600 ${activeTextClass}`}
                  >
                    {announcement.totalHouseholds}세대
                  </td>
                  <td
                    className={`px-3 py-2 whitespace-nowrap text-xs border-r border-gray-200 dark:border-gray-600 w-24 ${activeTextClass}`}
                  >
                    {new Date(announcement.announcementDate).toLocaleDateString(
                      "ko-KR",
                    )}
                  </td>
                  <td
                    className={`px-3 py-2 whitespace-nowrap text-xs border-r border-gray-200 dark:border-gray-600 ${activeTextClass}`}
                  >
                    <TruncatedCell
                      content={`${new Date(announcement.applicationStartDate).toLocaleDateString("ko-KR")} ~ ${new Date(announcement.applicationEndDate).toLocaleDateString("ko-KR")}`}
                      maxLength={50}
                    />
                  </td>
                  <td
                    className={`px-3 py-2 whitespace-nowrap text-xs border-r border-gray-200 dark:border-gray-600 w-24 ${activeTextClass}`}
                  >
                    {new Date(announcement.moveInDate).toLocaleDateString(
                      "ko-KR",
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs w-16">
                    <span
                      className={getViewCountColor(
                        announcement.viewCount,
                        isCompleted,
                      )}
                    >
                      {announcement.viewCount}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
