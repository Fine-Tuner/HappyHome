type Status = '모집중' | '모집예정' | '모집종료';

interface StatusBadgeProps {
  status: Status;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const statusStyles = {
    '모집중': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 ring-1 ring-green-200 dark:ring-green-700',
    '모집예정': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 ring-1 ring-blue-200 dark:ring-blue-700',
    '모집종료': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 ring-1 ring-gray-200 dark:ring-gray-700'
  };

  return (
    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${statusStyles[status]}`}>
      {status}
    </span>
  );
} 