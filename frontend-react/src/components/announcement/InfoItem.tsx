interface InfoItemProps {
  label: string;
  value: string | number;
}

export default function InfoItem({ label, value }: InfoItemProps) {
  return (
    <div>
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <p className="text-gray-900 dark:text-white">{value}</p>
    </div>
  );
} 