import { Link } from "react-router-dom";
import { useState } from "react";
import {
  getStatus,
  getViewCountColor,
  shimmerAnimation,
} from "../../util/list";
import TruncatedCell from "./TruncatedCell";
import { Announcement } from "../../types/announcement";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Settings2, Info, CheckCircle, XCircle } from "lucide-react";

interface AnnouncementListProps {
  itemList: Announcement[];
}

export default function AnnouncementList({ itemList }: AnnouncementListProps) {
  const announcements = itemList;

  // 테이블 열 정의
  const columns = [
    { key: "status", label: "상태", width: "w-auto" },
    { key: "eligibility", label: "충족유무", width: "w-28" },
    { key: "location", label: "위치", width: "w-auto" },
    { key: "announcementName", label: "공고명", width: "w-auto" },
    { key: "suplyType", label: "임대종류", width: "w-auto" },
    { key: "houseType", label: "주택유형", width: "w-auto" },
    { key: "targetGroup", label: "입주대상", width: "w-auto" },
    { key: "area", label: "전용면적", width: "w-auto" },
    { key: "totalHouseholds", label: "모집세대수", width: "w-auto" },
    { key: "announcementDate", label: "공고일", width: "w-24" },
    { key: "applicationPeriod", label: "신청기간", width: "w-auto" },
    { key: "moveInDate", label: "입주예정일", width: "w-24" },
    { key: "viewCount", label: "조회수", width: "w-16" },
  ];

  // 열 표시/숨김 상태 (기본적으로 모든 열 표시)
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    columns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {}),
  );

  // 열 표시/숨김 토글
  const toggleColumn = (columnKey: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };

  // 표시된 열 개수 (최소 1개는 유지)
  const visibleColumnCount =
    Object.values(visibleColumns).filter(Boolean).length;

  // m²를 평으로 변환하는 함수 (1평 = 3.3058m²)
  const convertToFloor = (area: number): string => {
    const floor = area / 3.3058;
    return floor.toFixed(1);
  };

  // 임시: 충족유무 판단 함수 (추후 실제 사용자 데이터와 매칭 로직으로 대체)
  const checkEligibility = (announcement: Announcement) => {
    // announcement.id를 시드로 사용하여 일관된 결과 생성
    const seed = announcement.id
      ? parseInt(announcement.id.toString().slice(-3)) || 0
      : 0;
    const isEligible = seed % 10 > 3; // 60% 확률로 충족

    if (isEligible) {
      return { status: "충족", reasons: [] };
    } else {
      // 임시 불충족 이유들
      const possibleReasons = [
        "소득 기준 초과",
        "자산 기준 초과",
        "연령 기준 미달",
        "거주지역 조건 불충족",
        "혼인상태 조건 불충족",
        "자녀 수 조건 불충족",
      ];

      // 시드를 사용하여 일관된 이유 선택
      const reasonCount = (seed % 3) + 1; // 1-3개
      const startIndex = seed % possibleReasons.length;
      const reasons = [];
      for (let i = 0; i < reasonCount; i++) {
        const index = (startIndex + i) % possibleReasons.length;
        reasons.push(possibleReasons[index]);
      }

      return { status: "불충족", reasons };
    }
  };

  // 셀 렌더링 함수
  const renderCell = (
    columnKey: string,
    announcement: Announcement,
    isCompleted: boolean,
    _activeTextClass: string,
  ) => {
    const status = getStatus(announcement);

    switch (columnKey) {
      case "status":
        return (
          <div className="flex justify-center">
            <span
              className={`px-2 py-0.5 rounded text-sm font-bold ${
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
        );
      case "location":
        return (
          <TruncatedCell
            content={announcement.address || "주소 미정"}
            maxLength={15}
          />
        );
      case "announcementName":
        return (
          <Link
            to={`/announcements/${announcement.id}`}
            className={`${isCompleted ? "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" : "text-blue-600 dark:text-blue-400 hover:underline"}`}
          >
            <TruncatedCell
              content={announcement.announcementName || "공고명 없음"}
              maxLength={40}
            />
          </Link>
        );
      case "suplyType":
        return (
          <TruncatedCell
            content={announcement.suplyType || "미정"}
            maxLength={10}
          />
        );
      case "houseType":
        return (
          <TruncatedCell
            content={announcement.houseType || "미정"}
            maxLength={15}
          />
        );
      case "targetGroup":
        return (
          <TruncatedCell
            content={announcement.targetGroup || "미정"}
            maxLength={15}
          />
        );
      case "area": {
        const areas =
          announcement.area && announcement.area.length > 0
            ? announcement.area.filter(
                (area) => area !== null && area !== undefined,
              )
            : [];

        if (areas.length === 0) {
          return <TruncatedCell content={["미정"]} maxLength={15} />;
        }

        return (
          <div className="group relative">
            <TruncatedCell
              content={areas.map((area) => `${area}㎡`)}
              maxLength={15}
            />
            {/* 툴팁 */}
            <div className="absolute left-1/2 bottom-full mb-2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 whitespace-nowrap">
              <div className="font-medium mb-1">평수 환산:</div>
              {areas.map((area, index) => (
                <div key={index}>
                  {area}㎡ = {convertToFloor(area)}평
                </div>
              ))}
              {/* 툴팁 화살표 */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
            </div>
          </div>
        );
      }
      case "totalHouseholds":
        return announcement.totalHouseholds
          ? `${announcement.totalHouseholds.toLocaleString()}세대`
          : "미정";
      case "announcementDate":
        return formatDate(announcement.announcementDate);
      case "applicationPeriod":
        return (
          <TruncatedCell
            content={`${formatDate(announcement.applicationStartDate)} ~ ${formatDate(announcement.applicationEndDate)}`}
            maxLength={50}
          />
        );
      case "moveInDate":
        return formatDate(announcement.moveInDate);
      case "viewCount":
        return (
          <span
            className={getViewCountColor(
              announcement.viewCount || 0,
              isCompleted,
            )}
          >
            {formatViewCount(announcement.viewCount || 0)}
          </span>
        );
      case "eligibility": {
        const eligibility = checkEligibility(announcement);
        const isEligible = eligibility.status === "충족";

        return (
          <div className="flex items-center justify-center gap-1">
            {isEligible ? (
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-700 dark:text-green-400 text-sm font-medium">
                  충족
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 group relative">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-red-700 dark:text-red-400 text-sm font-medium">
                  불충족
                </span>
                <Info className="h-3 w-3 text-gray-400 cursor-help" />

                {/* 툴팁 */}
                <div className="absolute left-1/2 bottom-full mb-2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                  <div className="font-medium mb-1">불충족 이유:</div>
                  {eligibility.reasons.map((reason, index) => (
                    <div key={index}>• {reason}</div>
                  ))}
                  {/* 툴팁 화살표 */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                </div>
              </div>
            )}
          </div>
        );
      }
      default:
        return null;
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "미정";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "미정";
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return "미정";
    }
  };

  const formatViewCount = (count: number): string => {
    if (!count && count !== 0) return "0";
    if (count >= 10000) {
      return `${Math.floor(count / 1000)}k`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  if (announcements.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">
          검색 결과가 없습니다
        </div>
        <div className="text-gray-400 dark:text-gray-500 text-sm">
          다른 조건으로 검색해보세요
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{shimmerAnimation}</style>

      {/* 열 설정 버튼 */}
      <div className="flex justify-end mb-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 text-sm">
              <Settings2 className="h-4 w-4" />열 설정
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56" align="end">
            <div className="space-y-3">
              <div className="font-medium text-sm">표시할 열 선택</div>
              <div className="space-y-2">
                {columns.map((column) => (
                  <div key={column.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={column.key}
                      checked={visibleColumns[column.key]}
                      onCheckedChange={() => toggleColumn(column.key)}
                      disabled={
                        visibleColumns[column.key] && visibleColumnCount === 1
                      }
                    />
                    <label
                      htmlFor={column.key}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {column.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden border-collapse">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              {columns
                .filter((column) => visibleColumns[column.key])
                .map((column, index, visibleColumnsArray) => (
                  <th
                    key={column.key}
                    className={`px-3 py-2 ${column.key === "status" ? "text-center" : "text-left"} text-sm font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${index < visibleColumnsArray.length - 1 ? "border-r border-gray-300 dark:border-gray-600" : ""} ${column.width} whitespace-nowrap`}
                  >
                    {column.label}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {announcements.map((announcement: Announcement) => {
              const status = getStatus(announcement);
              const isCompleted = status === "모집완료";
              const activeTextClass = isCompleted ? "" : "dark:text-white";
              return (
                <tr
                  key={announcement.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    isCompleted
                      ? "text-gray-400 dark:text-gray-500"
                      : status === "접수중"
                        ? "animate-bg-pulse"
                        : ""
                  }`}
                >
                  {columns
                    .filter((column) => visibleColumns[column.key])
                    .map((column, index, visibleColumnsArray) => (
                      <td
                        key={column.key}
                        className={`px-3 py-2 whitespace-nowrap text-sm ${index < visibleColumnsArray.length - 1 ? "border-r border-gray-200 dark:border-gray-600" : ""} ${column.width} ${column.key === "viewCount" ? "" : activeTextClass}`}
                      >
                        {renderCell(
                          column.key,
                          announcement,
                          isCompleted,
                          activeTextClass,
                        )}
                      </td>
                    ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
