import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AnnouncementList from '../components/AnnouncementList';
import FilterBar from '../components/FilterBar';
import { Announcement } from '../types/announcement';
import { api } from '../api/client';

export default function AnnouncementsPage() {
  const [filters, setFilters] = useState({
    location: '전체',
    targetGroup: '전체',
    minHouseholds: 0,
    maxHouseholds: 1000,
    minFloorArea: 0,
    maxFloorArea: 200,
    minLeasePeriod: 0,
    maxLeasePeriod: 30,
    buildingType: '전체'
  });

  // 공고 목록 조회
  const { data: announcements = [], isLoading, error } = useQuery({
    queryKey: ['announcements'],
    queryFn: api.getAnnouncements
  });

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  // 필터링된 공고 목록
  const filteredAnnouncements = announcements.filter((announcement) => {
    // 지역 필터링
    if (filters.location !== '전체' && !announcement.address.includes(filters.location)) {
      return false;
    }

    // 공급대상 필터링
    if (filters.targetGroup !== '전체' && !announcement.conditions.some(condition => 
      condition.includes(filters.targetGroup)
    )) {
      return false;
    }

    // 모집 세대수 필터링
    if (announcement.totalHouseholds < filters.minHouseholds || 
        announcement.totalHouseholds > filters.maxHouseholds) {
      return false;
    }

    // 임대기간 필터링 (기본값 10년으로 설정)
    const leasePeriod = 10;
    if (leasePeriod < filters.minLeasePeriod || leasePeriod > filters.maxLeasePeriod) {
      return false;
    }

    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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

        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">임대주택 입주자 모집공고</h1>
        
        {/* 필터 바 */}
        <FilterBar onFilterChange={handleFilterChange} />
        
        {/* 필터링된 공고 목록 */}
        <AnnouncementList announcements={filteredAnnouncements} />
      </div>
    </main>
  );
} 