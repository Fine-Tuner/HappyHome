'use client';

import { useState } from 'react';

interface FilterOptions {
  location: string;
  targetGroup: string;
  minHouseholds: number;
  maxHouseholds: number;
  minFloorArea: number;
  maxFloorArea: number;
  minLeasePeriod: number;
  maxLeasePeriod: number;
  buildingType: string;
}

interface FilterBarProps {
  onFilterChange: (filters: FilterOptions) => void;
}

const LOCATIONS = ['전체', '수원시', '성남시', '안양시', '안산시', '용인시', '광명시', '평택시', '과천시', '오산시', '시흥시', '군포시', '의왕시', '하남시', '이천시', '안성시', '김포시', '화성시', '광주시', '여주시', '부천시', '양평군', '가평군', '연천군'];
const TARGET_GROUPS = ['전체', '청년', '신혼부부', '다자녀가구'];
const BUILDING_TYPES = ['전체', '아파트', '오피스텔', '그 외'];

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    location: '전체',
    targetGroup: '전체',
    minHouseholds: 0,
    maxHouseholds: 1000,
    minFloorArea: 0,
    maxFloorArea: 100,
    minLeasePeriod: 0,
    maxLeasePeriod: 10,
    buildingType: '전체'
  });

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm mb-4">
      <div className="grid grid-cols-6 gap-4">
        {/* 지역 필터 */}
        <div className="col-span-1">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            지역
          </label>
          <select
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {LOCATIONS.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>

        {/* 공급대상 필터 */}
        <div className="col-span-1">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            대상
          </label>
          <select
            value={filters.targetGroup}
            onChange={(e) => handleFilterChange('targetGroup', e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TARGET_GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>

        {/* 모집 세대수 필터 */}
        <div className="col-span-1">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            세대수
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={filters.minHouseholds}
              onChange={(e) => handleFilterChange('minHouseholds', parseInt(e.target.value))}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-16"
              placeholder="최소"
            />
            <span className="text-gray-500 text-xs">~</span>
            <input
              type="number"
              value={filters.maxHouseholds}
              onChange={(e) => handleFilterChange('maxHouseholds', parseInt(e.target.value))}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-16"
              placeholder="최대"
            />
          </div>
        </div>

        {/* 전용면적 필터 */}
        <div className="col-span-1">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            면적
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={filters.minFloorArea}
              onChange={(e) => handleFilterChange('minFloorArea', parseInt(e.target.value))}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-16"
              placeholder="최소"
            />
            <span className="text-gray-500 text-xs">~</span>
            <input
              type="number"
              value={filters.maxFloorArea}
              onChange={(e) => handleFilterChange('maxFloorArea', parseInt(e.target.value))}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-16"
              placeholder="최대"
            />
          </div>
        </div>

        {/* 임대기간 필터 */}
        <div className="col-span-1">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            기간
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={filters.minLeasePeriod}
              onChange={(e) => handleFilterChange('minLeasePeriod', parseInt(e.target.value))}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-16"
              placeholder="최소"
            />
            <span className="text-gray-500 text-xs">~</span>
            <input
              type="number"
              value={filters.maxLeasePeriod}
              onChange={(e) => handleFilterChange('maxLeasePeriod', parseInt(e.target.value))}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-16"
              placeholder="최대"
            />
          </div>
        </div>

        {/* 건물종류 필터 */}
        <div className="col-span-1">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            종류
          </label>
          <select
            value={filters.buildingType}
            onChange={(e) => handleFilterChange('buildingType', e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {BUILDING_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
} 