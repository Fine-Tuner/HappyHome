'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Announcement } from '../../types/announcement';
import PdfPreview from '../../components/announcement/PdfPreview';
import PdfDownloadButton from '../../components/announcement/PdfDownloadButton';
import StatusBadge from '../../components/announcement/StatusBadge';
import InfoItem from '../../components/announcement/InfoItem';
import { pdfjs } from 'react-pdf';

// PDF.js 워커 설정
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

// 임시 데이터 - API 연동 후 삭제
const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    sn: '2024-001',
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
    sn: '2024-002',
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
    sn: '2024-003',
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
    sn: '2024-004',
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

export default function AnnouncementDetail() {
  const params = useParams();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);

  useEffect(() => {
    // API 연동 후 실제 데이터로 교체
    const foundAnnouncement = mockAnnouncements.find(a => a.sn === params.sn);
    setAnnouncement(foundAnnouncement || null);
  }, [params.sn]);

  if (!announcement) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600 dark:text-gray-300">
            공고문을 찾을 수 없습니다.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                {announcement.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {announcement.institution}
              </p>
            </div>
            <StatusBadge status={announcement.status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  기본 정보
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="공고번호" value={announcement.sn} />
                  <InfoItem label="공고일" value={announcement.announcementDate} />
                  <InfoItem label="신청기간" value={announcement.schedule} />
                  <InfoItem label="모집위치" value={announcement.location} />
                  <InfoItem label="모집 세대수" value={`${announcement.totalHouseholds}세대`} />
                  <InfoItem label="전용면적" value={announcement.floorArea} />
                  <InfoItem label="임대기간" value={announcement.leasePeriod} />
                  <InfoItem label="건물종류" value={announcement.buildingType} />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  대상 및 자격
                </h2>
                <div className="space-y-4">
                  <InfoItem label="공급대상" value={announcement.targetGroup} />
                  <InfoItem label="신청자격" value={announcement.eligibility} />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                공고문
              </h2>
              <div className="space-y-4">
                <PdfPreview
                  pdfUrl={announcement.pdfUrl}
                  currentPage={currentPage}
                  numPages={numPages}
                  onLoadSuccess={setNumPages}
                  onPageChange={(direction) => {
                    setCurrentPage(prev => 
                      direction === 'prev' 
                        ? Math.max(1, prev - 1)
                        : Math.min(numPages, prev + 1)
                    );
                  }}
                  onClick={() => window.open(announcement.pdfUrl, '_blank')}
                />
                <PdfDownloadButton pdfUrl={announcement.pdfUrl} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 