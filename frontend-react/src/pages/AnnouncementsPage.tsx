import { Suspense, useState } from "react";
import { AnnouncementFilter } from "../features/announcement/types/announcement";
import { useGetAnnouncements } from "../features/announcement/api/getAnnouncements";
import BetaBanner from "../features/announcement/components/list/BetaBanner";
import FilterBar from "../features/announcement/components/list/FilterBar";
import AnnouncementList from "../features/announcement/components/list/AnnouncementList";
import Pagination from "../shared/components/Pagination";

export default function AnnouncementsPage() {
  const [filters, setFilters] = useState<AnnouncementFilter>({
    brtcCode: "",
    signguCode: [],
    targetGroup: [],
    houseType: [],
    suplyType: [],
    minArea: 0,
    maxArea: 9999,
    yearMtBegin: "",
    yearMtEnd: "",
    announcementName: "",
    page: 1,
    pageSize: 12,
    sort: "latest",
  });

  const handleFilterChange = (newFilters: AnnouncementFilter) => {
    setFilters((prev) => ({ ...newFilters, sort: prev.sort, page: 1 }));
  };

  const handleSortChange = (sort: string) => {
    setFilters((prev) => ({ ...prev, sort, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const { data } = useGetAnnouncements({
    params: {
      page: filters.page || 1,
      limit: filters.pageSize || 12,
      provinceName: filters.brtcCode || undefined,
      districtName:
        filters.signguCode && filters.signguCode.length > 0
          ? filters.signguCode
          : undefined,
      supplyTypeName:
        filters.suplyType && filters.suplyType.length > 0
          ? filters.suplyType[0]
          : undefined,
      houseTypeName:
        filters.houseType && filters.houseType.length > 0
          ? filters.houseType[0]
          : undefined,
      beginDate: filters.yearMtBegin || undefined,
      endDate: filters.yearMtEnd || undefined,
      announcementName: filters.announcementName || undefined,
      sortType: filters.sort,
      announcementStatus: undefined,
    },
  });

  return (
    <main
      className="min-h-screen bg-white dark:bg-gradient-to-br"
      style={
        {
          "--tw-gradient-from": "#000000",
          "--tw-gradient-to": "#292e49",
          "--tw-gradient-stops":
            "var(--tw-gradient-from), var(--tw-gradient-to)",
        } as React.CSSProperties
      }
    >
      <div className="container mx-auto px-4 py-8">
        <BetaBanner />
        <h1 className="text-xl font-bold mb-8 text-gray-900 dark:text-white">
          임대주택 입주자 모집공고
        </h1>

        <FilterBar filters={filters} onFilterChange={handleFilterChange} />

        <Suspense fallback={<div>Loading...</div>}>
          <AnnouncementList
            itemList={data?.items ?? []}
            filters={filters}
            sort={filters.sort || "latest"}
            onSortChange={handleSortChange}
          />
        </Suspense>

        <Pagination
          page={filters.page || 1}
          pageSize={filters.pageSize || 12}
          totalCount={data?.totalCount ?? 0}
          onPageChange={handlePageChange}
        />
      </div>
    </main>
  );
}
