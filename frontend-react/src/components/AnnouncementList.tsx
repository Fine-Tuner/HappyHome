import { Link } from 'react-router-dom';
import { Announcement } from '../types/announcement';

interface AnnouncementListProps {
  announcements: Announcement[];
}

export default function AnnouncementList({ announcements }: AnnouncementListProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {announcements.map((announcement) => (
        <Link
          key={announcement.id}
          to={`/announcements/${announcement.id}`}
          className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
        >
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
            {announcement.name}
          </h2>
          <div className="space-y-2 text-gray-600 dark:text-gray-300">
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
              {announcement.conditions.join(', ')}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
} 