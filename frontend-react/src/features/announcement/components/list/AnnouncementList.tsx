import { Link } from "react-router-dom";
import { Announcement } from "../../../../types/announcement";
import { AnnouncementFilter } from "../../../../types/announcement";
import { useState } from "react";
import SortToggle from "./SortToggle";
import StatusMultiToggle from "./StatusMultiToggle";
import {
  getStatus,
  getViewCountColor,
  shimmerAnimation,
} from "../../util/list";
import TruncatedCell from "./TruncatedCell";

interface AnnouncementListProps {
  itemList: Announcement[];
  filters: AnnouncementFilter;
  sort: string;
  onSortChange: (sort: string) => void;
}

export default function AnnouncementList({
  itemList,
  filters,
  sort,
  onSortChange,
}: AnnouncementListProps) {
  const announcements = itemList;
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
