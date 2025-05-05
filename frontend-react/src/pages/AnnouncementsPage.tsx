import { Suspense, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AnnouncementList from '../components/AnnouncementList';
import FilterBar from '../components/FilterBar';
import { Announcement, AnnouncementFilter } from '../types/announcement';
import { api } from '../api/client';

interface Item {
  sn: number;
  announcementName: string;
  address: string;
  targetGroup: string[];
  houseType: string[];
  area: number[];
  announcementDate: string;
  applicationStartDate: string;
  applicationEndDate: string;
  moveInDate: string;
  totalHouseholds: number;
  suplyType: string;
  viewCount: number;
}

interface AnnouncementListResponse {
  items: Announcement[];
  totalCount: number;
}

function Pagination({ page, pageSize, totalCount, onPageChange }: {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.ceil(totalCount / pageSize);
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center gap-2 mt-8">
      <button
        className="px-3 py-1 rounded border bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600 disabled:opacity-50"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >이전</button>
      {Array.from({ length: totalPages }).map((_, idx) => (
        <button
          key={idx + 1}
          className={`px-3 py-1 rounded border ${page === idx + 1 ? 'bg-blue-500 text-white border-blue-500' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600'}`}
          onClick={() => onPageChange(idx + 1)}
        >{idx + 1}</button>
      ))}
      <button
        className="px-3 py-1 rounded border bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600 disabled:opacity-50"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >다음</button>
    </div>
  );
}

export default function AnnouncementsPage() {
  const [filters, setFilters] = useState<AnnouncementFilter>({
    brtcCode: '',
    signguCode: '',
    targetGroup: [],
    houseType: [],
    suplyType: [],
    minArea: 0,
    maxArea: 9999,
    yearMtBegin: '',
    yearMtEnd: '',
    announcementName: '',
    page: 1,
    pageSize: 12,
    sort: 'latest'
  });

  const handleFilterChange = (newFilters: AnnouncementFilter) => {
    setFilters(prev => ({ ...newFilters, sort: prev.sort, page: 1 }));
  };

  const handleSortChange = (sort: string) => {
    setFilters(prev => ({ ...prev, sort, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const { data, error } = useQuery<AnnouncementListResponse>({
    queryKey: ['announcements', filters],
    queryFn: () => api.getAnnouncements(filters)
  });

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-red-500 dark:text-red-400">
          데이터를 불러오는 중 오류가 발생했습니다.
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* 베타 테스트 공지사항 배너 */}
        <div className="mb-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center gap-3">
          <div className="flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200">베타 테스트 안내</h2>
            <p className="text-blue-700 dark:text-blue-300">현재 Beta 테스트로 "경기도" 지역의 임대주택 공고 정보만 제공하고 있습니다. 더 많은 지역이 곧 추가될 예정입니다.</p>
          </div>
        </div>

        <h1 className="text-xl font-bold mb-8 text-gray-900 dark:text-white">임대주택 입주자 모집공고</h1>
        
        {/* 필터 바 */}
        <FilterBar onFilterChange={handleFilterChange} />
        
        {/* 공고 목록 */}
        <Suspense fallback={<div>Loading...</div>}>
          <AnnouncementList 
            filters={filters} 
            sort={filters.sort || 'latest'} 
            onSortChange={handleSortChange} 
          />
        </Suspense>
        {/* 페이지네이션 */}
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