const STATUS_OPTIONS = [
  { value: "공고중", label: "공고중" },
  { value: "접수중", label: "접수중" },
  { value: "모집완료", label: "모집완료" },
];

export default function StatusMultiToggle({
  value,
  onChange,
}: {
  value: string[];
  onChange: (val: string[]) => void;
}) {
  const handleToggle = (status: string) => {
    if (value.includes(status)) {
      onChange(value.filter((v) => v !== status));
    } else {
      onChange([...value, status]);
    }
  };
  return (
    <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mr-2">
      {STATUS_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`px-2 py-1 text-xs font-medium transition
              ${
                value.includes(opt.value)
                  ? "bg-blue-500 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              }
              ${opt.value === "공고중" ? "rounded-l-lg" : ""} ${opt.value === "모집완료" ? "rounded-r-lg" : ""}`}
          onClick={() => handleToggle(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
