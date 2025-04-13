interface InfoItemProps {
  label: string;
  value: string;
}

export default function InfoItem({ label, value }: InfoItemProps) {
  return (
    <div className="space-y-1 group/item">
      <p className="text-gray-500 dark:text-gray-400 group-hover/item:text-blue-500 dark:group-hover/item:text-blue-400 transition-colors duration-300 text-xs">
        {label}
      </p>
      <p className="text-gray-900 dark:text-gray-100 font-medium">
        {value}
      </p>
    </div>
  );
} 