'use client';

import { useState } from 'react';
import AnnouncementList from './components/AnnouncementList';
import FilterBar from './components/FilterBar';
import { Announcement } from './types/announcement';

// 임시 데이터 - API 연동 후 삭제
const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: '2024년 서울시 행복주택 1차 모집공고',
    institution: '서울특별시',
    announcementDate: '2024-04-01',
    applicationStartDate: '2024-04-15',
    applicationEndDate: '2024-04-30',
    status: '모집예정',
    location: '서울시 강남구',
    totalHouseholds: 100,
    pdfUrl: '/공고문_17779_20250405_135700.pdf',
    targetGroup: '청년, 신혼부부',
    eligibility: '무주택자, 소득기준 충족자',
    schedule: '2024-04-15 ~ 2024-04-30',
    floorArea: '전용 59㎡',
    leasePeriod: '2년',
    buildingType: '아파트'
  },
  {
    id: '2',
    title: '2024년 경기도 행복주택 2차 모집공고',
    institution: '경기도',
    announcementDate: '2024-03-25',
    applicationStartDate: '2024-04-01',
    applicationEndDate: '2024-04-15',
    status: '모집중',
    location: '경기도 수원시',
    totalHouseholds: 150,
    pdfUrl: '/공고문_17808_20250405_135646.pdf',
    targetGroup: '청년, 신혼부부, 다자녀가구',
    eligibility: '무주택자, 소득기준 충족자',
    schedule: '2024-04-01 ~ 2024-04-15',
    floorArea: '전용 84㎡',
    leasePeriod: '2년',
    buildingType: '오피스텔'
  },
  {
    id: '3',
    title: '2024년 경기도 행복주택 3차 모집공고',
    institution: '경기도',
    announcementDate: '2024-04-05',
    applicationStartDate: '2024-04-20',
    applicationEndDate: '2024-05-05',
    status: '모집예정',
    location: '경기도 성남시',
    totalHouseholds: 200,
    pdfUrl: '/공고문_17870_20250331_224621.pdf',
    targetGroup: '청년, 신혼부부',
    eligibility: '무주택자, 소득기준 충족자',
    schedule: '2024-04-20 ~ 2024-05-05',
    floorArea: '전용 74㎡',
    leasePeriod: '2년',
    buildingType: '아파트'
  },
  {
    id: '4',
    title: '2024년 경기도 행복주택 4차 모집공고',
    institution: '경기도',
    announcementDate: '2024-04-10',
    applicationStartDate: '2024-04-25',
    applicationEndDate: '2024-05-10',
    status: '모집예정',
    location: '경기도 안양시',
    totalHouseholds: 180,
    pdfUrl: '/{공고문(PDF)}_(최종)대전광역시시유성구10년임대 분납임대주택예비입주자모집.pdf',
    targetGroup: '청년, 신혼부부, 다자녀가구',
    eligibility: '무주택자, 소득기준 충족자',
    schedule: '2024-04-25 ~ 2024-05-10',
    floorArea: '전용 69㎡',
    leasePeriod: '2년',
    buildingType: '그 외'
  }
];

export default function Home() {
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>(mockAnnouncements);

  const handleFilterChange = (filters: any) => {
    const filtered = mockAnnouncements.filter((announcement) => {
      // 지역 필터링
      if (filters.location !== '전체' && !announcement.location.includes(filters.location)) {
        return false;
      }

      // 공급대상 필터링
      if (filters.targetGroup !== '전체' && !announcement.targetGroup.includes(filters.targetGroup)) {
        return false;
      }

      // 모집 세대수 필터링
      const households = parseInt(announcement.totalHouseholds.toString());
      if (households < filters.minHouseholds || households > filters.maxHouseholds) {
        return false;
      }

      // 전용면적 필터링
      const floorArea = parseInt(announcement.floorArea.replace(/[^0-9]/g, ''));
      if (floorArea < filters.minFloorArea || floorArea > filters.maxFloorArea) {
        return false;
      }

      // 임대기간 필터링
      const leasePeriod = parseInt(announcement.leasePeriod.replace(/[^0-9]/g, ''));
      if (leasePeriod < filters.minLeasePeriod || leasePeriod > filters.maxLeasePeriod) {
        return false;
      }

      // 건물종류 필터링
      if (filters.buildingType !== '전체' && announcement.buildingType !== filters.buildingType) {
        return false;
      }

      return true;
    });

    setFilteredAnnouncements(filtered);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      {/* 베타 테스트 공지사항 배너 */}
      <div className="mb-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center gap-3">
        <div className="flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200">베타 테스트 안내</h2>
          <p className="text-blue-700 dark:text-blue-300">현재 Beta 테스트로 "경기도" 지역의 행복주택 정보만 제공하고 있습니다. 더 많은 지역이 곧 추가될 예정입니다.</p>
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-8">행복주택 공고문</h1>
      
      {/* 필터 바 */}
      <FilterBar onFilterChange={handleFilterChange} />
      
      {/* 필터링된 공고 목록 */}
      <AnnouncementList announcements={filteredAnnouncements} />
    </main>
  );
}
