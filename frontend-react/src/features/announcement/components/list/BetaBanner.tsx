export default function BetaBanner() {
  return (
    <div className="mb-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center gap-3">
      <div className="flex-shrink-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-blue-600 dark:text-blue-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
          베타 테스트 안내
        </h2>
        <p className="text-blue-700 dark:text-blue-300">
          현재 Beta 테스트로 "경기도" 지역의 임대주택 공고 정보만 제공하고
          있습니다. 더 많은 지역이 곧 추가될 예정입니다.
        </p>
      </div>
    </div>
  );
}
