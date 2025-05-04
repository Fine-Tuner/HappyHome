import { useState } from 'react';

interface FilterBarProps {
  onFilterChange: (filters: {
    location: string;
    targetGroup: string;
    minHouseholds: number;
    maxHouseholds: number;
    minFloorArea: number;
    maxFloorArea: number;
    minLeasePeriod: number;
    maxLeasePeriod: number;
    buildingType: string;
  }) => void;
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [filters, setFilters] = useState({
    location: '전체',
    targetGroup: '전체',
    minHouseholds: 0,
    maxHouseholds: 1000,
    minFloorArea: 0,
    maxFloorArea: 200,
    minLeasePeriod: 0,
    maxLeasePeriod: 30,
    buildingType: '전체'
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    const newFilters = {
      ...filters,
      [name]: name.includes('min') || name.includes('max') ? Number(value) : value
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 지역 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            지역
          </label>
          <select
            name="location"
            value={filters.location}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="전체">전체</option>
            <option value="서울">서울</option>
            <option value="경기">경기</option>
            <option value="인천">인천</option>
          </select>
        </div>

        {/* 공급대상 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            공급대상
          </label>
          <select
            name="targetGroup"
            value={filters.targetGroup}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="전체">전체</option>
            <option value="청년">청년</option>
            <option value="신혼부부">신혼부부</option>
            <option value="다자녀가구">다자녀가구</option>
          </select>
        </div>

        {/* 모집 세대수 범위 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            모집 세대수
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              name="minHouseholds"
              value={filters.minHouseholds}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="최소"
            />
            <span className="text-gray-500 dark:text-gray-400">~</span>
            <input
              type="number"
              name="maxHouseholds"
              value={filters.maxHouseholds}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="최대"
            />
          </div>
        </div>

        {/* 임대기간 범위 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            임대기간 (년)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              name="minLeasePeriod"
              value={filters.minLeasePeriod}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="최소"
            />
            <span className="text-gray-500 dark:text-gray-400">~</span>
            <input
              type="number"
              name="maxLeasePeriod"
              value={filters.maxLeasePeriod}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="최대"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 