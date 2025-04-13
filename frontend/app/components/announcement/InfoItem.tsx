interface InfoItemProps {
  label: string;
  value: string;
}

export default function InfoItem({ label, value }: InfoItemProps) {
  return (
    <div className="space-y-1 group/item">
      <p className="text-gray-600 dark:text-gray-400 group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors duration-300 text-xs">
        {label}
      </p>
      <p className="text-gray-800 dark:text-gray-200 font-medium">
        {value}
      </p>
    </div>
  );
} 