'use client';

import { useState } from 'react';
import AnnouncementList from '../components/AnnouncementList';
import FilterBar from '../components/FilterBar';
import { Announcement } from '../types/announcement';

// 임시 데이터 - API 연동 후 삭제
const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    announcement_id: 2024001,
    announcement_name: '2024년 서울시 행복주택 1차 모집공고',
    housing_name: '서울 행복주택',
    supply_institution_name: '서울특별시',
    full_address: '서울시 강남구 테헤란로 123',
    total_supply_count: 100,
    rent_guarantee: 10000000,
    monthly_rent: 500000,
    pdf_url: '/공고문_17779_20250405_135700.pdf',
    begin_date: '2024-04-15T00:00:00Z',
    end_date: '2024-04-30T23:59:59Z',
    file_path: '/uploads/2024/04/공고문_17779_20250405_135700.pdf',
    type: '청년',
    created_at: '2024-04-01T00:00:00Z',
    updated_at: '2024-04-01T00:00:00Z',
    conditions: [
      {
        id: '1',
        announcement_id: '1',
        llm_output_id: '1',
        content: '무주택자',
        section: '신청자격',
        category: '기본자격',
        pages: [1],
        created_at: '2024-04-01T00:00:00Z'
      }
    ]
  },
  {
    id: '2',
    announcement_id: 2024002,
    announcement_name: '2024년 경기도 행복주택 2차 모집공고',
    housing_name: '경기 행복주택',
    supply_institution_name: '경기도',
    full_address: '경기도 수원시 팔달구 인계로 123',
    total_supply_count: 150,
    rent_guarantee: 8000000,
    monthly_rent: 400000,
    pdf_url: '/공고문_17808_20250405_135646.pdf',
    begin_date: '2024-04-01T00:00:00Z',
    end_date: '2024-04-15T23:59:59Z',
    file_path: '/uploads/2024/04/공고문_17808_20250405_135646.pdf',
    type: '신혼부부',
    created_at: '2024-03-25T00:00:00Z',
    updated_at: '2024-03-25T00:00:00Z',
    conditions: [
      {
        id: '2',
        announcement_id: '2',
        llm_output_id: '2',
        content: '무주택자',
        section: '신청자격',
        category: '기본자격',
        pages: [1],
        created_at: '2024-03-25T00:00:00Z'
      }
    ]
  },
  {
    id: '3',
    announcement_id: 2024003,
    announcement_name: '2024년 경기도 행복주택 3차 모집공고',
    housing_name: '경기 행복주택',
    supply_institution_name: '경기도',
    full_address: '경기도 성남시 분당구 판교로 123',
    total_supply_count: 200,
    rent_guarantee: 9000000,
    monthly_rent: 450000,
    pdf_url: '/공고문_17870_20250331_224621.pdf',
    begin_date: '2024-04-20T00:00:00Z',
    end_date: '2024-05-05T23:59:59Z',
    file_path: '/uploads/2024/04/공고문_17870_20250331_224621.pdf',
    type: '청년',
    created_at: '2024-04-05T00:00:00Z',
    updated_at: '2024-04-05T00:00:00Z',
    conditions: [
      {
        id: '3',
        announcement_id: '3',
        llm_output_id: '3',
        content: '무주택자',
        section: '신청자격',
        category: '기본자격',
        pages: [1],
        created_at: '2024-04-05T00:00:00Z'
      }
    ]
  },
  {
    id: '4',
    announcement_id: 2024004,
    announcement_name: '2024년 경기도 행복주택 4차 모집공고',
    housing_name: '경기 행복주택',
    supply_institution_name: '경기도',
    full_address: '경기도 안양시 동안구 평촌대로 123',
    total_supply_count: 180,
    rent_guarantee: 8500000,
    monthly_rent: 425000,
    pdf_url: '/{공고문(PDF)}_(최종)대전광역시시유성구10년임대 분납임대주택예비입주자모집.pdf',
    begin_date: '2024-04-25T00:00:00Z',
    end_date: '2024-05-10T23:59:59Z',
    file_path: '/uploads/2024/04/{공고문(PDF)}_(최종)대전광역시시유성구10년임대 분납임대주택예비입주자모집.pdf',
    type: '다자녀가구',
    created_at: '2024-04-10T00:00:00Z',
    updated_at: '2024-04-10T00:00:00Z',
    conditions: [
      {
        id: '4',
        announcement_id: '4',
        llm_output_id: '4',
        content: '무주택자',
        section: '신청자격',
        category: '기본자격',
        pages: [1],
        created_at: '2024-04-10T00:00:00Z'
      }
    ]
  }
];

export default function AnnouncementsPage() {
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>(mockAnnouncements);

  const handleFilterChange = (filters: any) => {
    const filtered = mockAnnouncements.filter((announcement) => {
      // 지역 필터링
      if (filters.location !== '전체' && !announcement.full_address.includes(filters.location)) {
        return false;
      }

      // 공급대상 필터링
      if (filters.targetGroup !== '전체' && !announcement.type.includes(filters.targetGroup)) {
        return false;
      }

      // 모집 세대수 필터링
      if (announcement.total_supply_count < filters.minHouseholds || announcement.total_supply_count > filters.maxHouseholds) {
        return false;
      }

      // 임대보증금 필터링
      if (announcement.rent_guarantee < filters.minRentGuarantee || announcement.rent_guarantee > filters.maxRentGuarantee) {
        return false;
      }

      // 월임대료 필터링
      if (announcement.monthly_rent < filters.minMonthlyRent || announcement.monthly_rent > filters.maxMonthlyRent) {
        return false;
      }

      return true;
    });

    setFilteredAnnouncements(filtered);
  };

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