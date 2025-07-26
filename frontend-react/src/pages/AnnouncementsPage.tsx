import React, { useState } from "react";
import {
  AnnouncementFilter,
  SORT_TYPE,
} from "../features/announcement/types/announcement";
import { useGetAnnouncements } from "../features/announcement/api/getAnnouncements";

import FilterBar from "../features/announcement/components/list/FilterBar";
import AnnouncementList from "../features/announcement/components/list/AnnouncementList";
import Pagination from "../shared/components/Pagination";
import ThemeToggle from "../features/theme/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { User, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import Spinner from "../shared/components/Spinner";
import { MapPinHouse } from "lucide-react";

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
    announcementStatus: [],
    page: 1,
    pageSize: 12,
    sort: SORT_TYPE.LATEST,
  });

  const handleFilterChange = (newFilters: AnnouncementFilter) => {
    setFilters({ ...newFilters, sort: filters.sort, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // 광역시도 코드를 이름으로 변환
  const getProvinceName = (brtcCode: string): string | undefined => {
    const provinceMap: Record<string, string> = {
      "41": "경기",
      // 필요시 다른 지역 추가
    };
    return brtcCode ? provinceMap[brtcCode] : undefined;
  };

  // 시군구 코드를 이름으로 변환
  const getDistrictNames = (signguCodes: string[]): string[] | undefined => {
    if (!signguCodes || signguCodes.length === 0) return undefined;

    const districtMap: Record<string, string> = {
      "111": "수원시 장안구",
      "113": "수원시 권선구",
      "115": "수원시 팔달구",
      "117": "수원시 영통구",
      "131": "성남시 수정구",
      "133": "성남시 중원구",
      "135": "성남시 분당구",
      "150": "의정부시",
      "171": "안양시 만안구",
      "173": "안양시 동안구",
      "190": "부천시",
      "210": "광명시",
      "220": "평택시",
      "250": "동두천시",
      "271": "안산시 상록구",
      "273": "안산시 단원구",
      "281": "고양시 덕양구",
      "285": "고양시 일산동구",
      "287": "고양시 일산서구",
      "290": "과천시",
      "310": "구리시",
      "360": "남양주시",
      "370": "오산시",
      "390": "시흥시",
      "410": "군포시",
      "430": "의왕시",
      "450": "하남시",
      "461": "용인시 처인구",
      "463": "용인시 기흥구",
      "465": "용인시 수지구",
      "480": "파주시",
      "500": "이천시",
      "550": "안성시",
      "570": "김포시",
      "590": "화성시",
      "610": "광주시",
      "630": "양주시",
      "670": "포천시",
      "680": "여주시",
      "800": "연천군",
      "820": "가평군",
      "830": "양평군",
    };

    return signguCodes.map((code) => districtMap[code]).filter(Boolean);
  };

  const { data, isLoading, isFetching, isError, error } = useGetAnnouncements({
    params: {
      page: filters.page || 1,
      limit: filters.pageSize || 12,
      provinceName: getProvinceName(filters.brtcCode || ""),
      districtName: getDistrictNames(filters.signguCode || []),
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
      announcementStatus:
        filters.announcementStatus && filters.announcementStatus.length > 0
          ? filters.announcementStatus[0]
          : undefined,
    },
  });

  // 초기 로딩 중이고 데이터가 없는 경우
  if (isLoading && !data) {
    return (
      <>
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPinHouse className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <h1 className="text-3xl font-normal bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent font-['Lobster',_cursive] tracking-normal">
                  Happy Home
                </h1>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 pt-20">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <Spinner />
            </div>
          </div>
        </main>
      </>
    );
  }

  // 에러 발생 시
  if (isError) {
    return (
      <>
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPinHouse className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <h1 className="text-3xl font-normal bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent font-['Lobster',_cursive] tracking-normal">
                  Happy Home
                </h1>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 pt-20">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <p className="text-red-600 dark:text-red-400 mb-4">
                  데이터를 불러오는 중 오류가 발생했습니다.
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {error?.message || "알 수 없는 오류"}
                </p>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      {/* 고정 헤더 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPinHouse className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-3xl font-normal bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent font-['Lobster',_cursive] tracking-normal">
                Happy Home
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  로그인
                </Button>
              </Link>
              <Link to="/mypage">
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  마이페이지
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 pt-20">
        <div className="container mx-auto px-4 py-4">
          {/* 정보 배너 */}
          <div className="mb-6 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-600 dark:text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  현재는 경기도 지역만 제공합니다. 다른 지역은 순차적으로 추가될
                  예정입니다.
                </p>
              </div>
            </div>
          </div>

          {/* 필터 바에 로딩 표시 추가 */}
          <div className="relative">
            <FilterBar filters={filters} onFilterChange={handleFilterChange} />
            {isFetching && (
              <div className="absolute top-2 right-2 z-10">
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-1 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    업데이트 중...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 공고 리스트 */}
          <div className="relative">
            <AnnouncementList itemList={data?.items ?? []} />
            {/* 데이터 로딩 중일 때 오버레이 표시 */}
            {isFetching && data && (
              <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-lg pointer-events-none">
                <div className="flex items-center justify-center h-full">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700">
                    <Spinner />
                  </div>
                </div>
              </div>
            )}
          </div>

          <Pagination
            page={filters.page || 1}
            pageSize={filters.pageSize || 12}
            totalCount={data?.totalCount ?? 0}
            onPageChange={handlePageChange}
          />
        </div>
      </main>
    </>
  );
}
