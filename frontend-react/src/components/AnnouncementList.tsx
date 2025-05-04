import { Link } from 'react-router-dom';
import { Announcement } from '../types/announcement';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { AnnouncementFilter } from '../types/announcement';

const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'views', label: '조회순' }
];

function SortToggle({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
      {SORT_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`px-4 py-2 text-sm font-medium transition
            ${value === opt.value
              ? 'bg-blue-500 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}
            ${opt.value === 'latest' ? 'rounded-l-lg' : ''} ${opt.value === 'views' ? 'rounded-r-lg' : ''}`}
          onClick={() => onChange(opt.value)}
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

  if (today < applicationStartDate && today >= announcementDate) {
    return '공고중';
  }
  if (today >= applicationStartDate && today <= applicationEndDate) {
    return '접수중';
  }
  if (today > applicationEndDate) {
    return '모집완료';
  }
  return '';
}

export default function AnnouncementList({ filters, sort, onSortChange }: AnnouncementListProps) {
  const { data } = useQuery({
    queryKey: ['announcements', filters],
    queryFn: () => api.getAnnouncements(filters)
  });

  const announcements = data?.items || [];

  return (
    <>
      <div className="flex justify-end mb-4">
        <SortToggle value={sort} onChange={onSortChange} />
      </div>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {announcements.map((announcement: Announcement) => {
          const status = getStatus(announcement);
          return (
            <Link
              key={announcement.sn}
              to={`/announcements/${announcement.sn}`}
              className="block p-7 bg-white dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 shadow-lg hover:shadow-xl hover:border-blue-400 transition-all duration-200"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${status === '공고중' ? 'border-green-200 bg-green-50 text-green-700' : status === '접수중' ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-gray-300 bg-gray-100 text-gray-600'}`}>
                  {status}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-bold border border-blue-200 bg-blue-50 text-blue-700">
                  {announcement.suplyType}
                </span>
                <span className="ml-auto text-xs text-gray-500 flex items-center gap-1">
                  <svg className="w-4 h-4 inline-block" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  {announcement.viewCount}
                </span>
              </div>
              <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                {announcement.announcementName}
              </h2>
              <div className="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
                <p>
                  <span className="font-medium">지역:</span> {announcement.address}
                </p>
                <p>
                  <span className="font-medium">공고일:</span>{' '}
                  {new Date(announcement.announcementDate).toLocaleDateString('ko-KR')}
                </p>
                <p>
                  <span className="font-medium">신청기간:</span>{' '}
                  {new Date(announcement.applicationStartDate).toLocaleDateString('ko-KR')} ~{' '}
                  {new Date(announcement.applicationEndDate).toLocaleDateString('ko-KR')}
                </p>
                <p>
                  <span className="font-medium">입주예정일:</span>{' '}
                  {new Date(announcement.moveInDate).toLocaleDateString('ko-KR')}
                </p>
                <p>
                  <span className="font-medium">모집세대수:</span> {announcement.totalHouseholds}세대
                </p>
                <p>
                  <span className="font-medium">신청자격:</span>{' '}
                  {Array.isArray(announcement.targetGroup) ? announcement.targetGroup.join(', ') : announcement.targetGroup || '없음'}
                </p>
                <p>
                  <span className="font-medium">주택유형:</span>{' '}
                  {Array.isArray(announcement.houseType) ? announcement.houseType.join(', ') : announcement.houseType || '없음'}
                </p>
                <p>
                  <span className="font-medium">전용면적:</span>{' '}
                  {Array.isArray(announcement.area) ? announcement.area.map(area => `${area}㎡`).join(', ') : announcement.area || '없음'}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
} 