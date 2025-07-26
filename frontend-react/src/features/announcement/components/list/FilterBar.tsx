import React, { useState } from "react";
import { AnnouncementFilter } from "../../types/announcement";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  CalendarIcon,
  ChevronDown,
  ChevronUp,
  X,
  RotateCcw,
  ListFilter,
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface FilterBarProps {
  filters: AnnouncementFilter;
  onFilterChange: (filters: AnnouncementFilter) => void;
}

const BRTC_LIST = [
  { code: "", name: "전체" },
  { code: "41", name: "경기" },
];

const SIGNGU_LIST: Record<string, { code: string; name: string }[]> = {
  "41": [
    { code: "", name: "전체" },
    { code: "111", name: "수원시 장안구" },
    { code: "113", name: "수원시 권선구" },
    { code: "115", name: "수원시 팔달구" },
    { code: "117", name: "수원시 영통구" },
    { code: "131", name: "성남시 수정구" },
    { code: "133", name: "성남시 중원구" },
    { code: "135", name: "성남시 분당구" },
    { code: "150", name: "의정부시" },
    { code: "171", name: "안양시 만안구" },
    { code: "173", name: "안양시 동안구" },
    { code: "190", name: "부천시" },
    { code: "210", name: "광명시" },
    { code: "220", name: "평택시" },
    { code: "250", name: "동두천시" },
    { code: "271", name: "안산시 상록구" },
    { code: "273", name: "안산시 단원구" },
    { code: "281", name: "고양시 덕양구" },
    { code: "285", name: "고양시 일산동구" },
    { code: "287", name: "고양시 일산서구" },
    { code: "290", name: "과천시" },
    { code: "310", name: "구리시" },
    { code: "360", name: "남양주시" },
    { code: "370", name: "오산시" },
    { code: "390", name: "시흥시" },
    { code: "410", name: "군포시" },
    { code: "430", name: "의왕시" },
    { code: "450", name: "하남시" },
    { code: "461", name: "용인시 처인구" },
    { code: "463", name: "용인시 기흥구" },
    { code: "465", name: "용인시 수지구" },
    { code: "480", name: "파주시" },
    { code: "500", name: "이천시" },
    { code: "550", name: "안성시" },
    { code: "570", name: "김포시" },
    { code: "590", name: "화성시" },
    { code: "610", name: "광주시" },
    { code: "630", name: "양주시" },
    { code: "670", name: "포천시" },
    { code: "680", name: "여주시" },
    { code: "800", name: "연천군" },
    { code: "820", name: "가평군" },
    { code: "830", name: "양평군" },
  ],
};

const TARGET_GROUPS = [
  "대학생",
  "신혼부부",
  "주거취약계층",
  "저소득층",
  "무주택자",
  "유주택자",
];

const SUPLY_TYPES = [
  "영구임대",
  "국민임대",
  "50년임대",
  "매입임대",
  "10년임대",
  "6년임대",
  "5년임대",
  "장기전세",
  "전세임대",
  "행복주택",
  "공공지원민간임대주택",
  "통합공공임대",
];

const HOUSE_TYPES = [
  "아파트",
  "연립주택",
  "다세대주택",
  "단독주택",
  "다가구주택",
  "오피스텔",
  "기숙사",
];

const AREA_OPTIONS = [
  { label: "전체", min: 0, max: 9999 },
  { label: "40m² 미만", min: 0, max: 39.99 },
  { label: "40~60m² 미만", min: 40, max: 59.99 },
  { label: "60~85m² 미만", min: 60, max: 84.99 },
  { label: "85m² 초과", min: 85, max: 9999 },
];

const ANNOUNCEMENT_STATUSES = ["공고중", "접수중", "모집완료"];

const ELIGIBILITY_STATUSES = ["충족", "불충족"];

interface MultiSelectProps {
  placeholder: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  searchPlaceholder?: string;
  singleSelect?: boolean;
}

function MultiSelect({
  placeholder,
  options,
  selected,
  onChange,
  searchPlaceholder = "검색...",
  singleSelect = false,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const handleUnselect = (value: string) => {
    onChange(selected.filter((item) => item !== value));
  };

  const handleSelect = (value: string) => {
    if (value === "all") {
      onChange([]);
      return;
    }

    if (singleSelect) {
      onChange([value]);
      setOpen(false);
      return;
    }

    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const selectedLabels = selected.map(
    (value) => options.find((option) => option.value === value)?.label || value,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-9 w-full justify-between font-normal"
        >
          <div className="flex items-center min-w-0 flex-1 gap-1">
            {selected.length === 0 ? (
              <span className="text-muted-foreground truncate">
                {placeholder}
              </span>
            ) : (
              <div className="flex items-center gap-1 min-w-0 flex-1">
                {/* 첫 번째 선택 항목만 표시 */}
                <Badge
                  variant="secondary"
                  className="text-xs px-2 py-0 h-5 shrink-0"
                >
                  {selectedLabels[0]}
                </Badge>
                {/* 추가 항목이 있으면 개수 표시 */}
                {selectedLabels.length > 1 && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    +{selectedLabels.length - 1}개
                  </span>
                )}
              </div>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 max-w-sm" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => handleSelect("all")}
                className="cursor-pointer"
              >
                <Checkbox checked={selected.length === 0} className="mr-2" />
                전체
              </CommandItem>
              {options
                .filter(
                  (option) => option.value !== "all" && option.value !== "",
                )
                .map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className="cursor-pointer"
                  >
                    <Checkbox
                      checked={selected.includes(option.value)}
                      className="mr-2"
                    />
                    {option.label}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
        {/* 선택된 항목들을 하단에 표시 */}
        {selected.length > 0 && (
          <div className="p-2 border-t max-w-full">
            <div className="text-xs text-muted-foreground mb-2">
              선택된 항목:
            </div>
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto max-w-full">
              {selectedLabels.map((label) => (
                <Badge
                  key={label}
                  variant="secondary"
                  className="text-xs px-2 py-0 h-5 cursor-pointer hover:bg-destructive hover:text-destructive-foreground max-w-[120px] truncate"
                  onClick={(e) => {
                    e.stopPropagation();
                    const value = options.find(
                      (option) => option.label === label,
                    )?.value;
                    if (value) handleUnselect(value);
                  }}
                >
                  <span className="truncate">{label}</span>
                  <X className="ml-1 h-3 w-3 shrink-0" />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

interface DatePickerProps {
  placeholder: string;
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
}

function DatePicker({ placeholder, selected, onSelect }: DatePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-9 w-full justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? (
            format(selected, "yyyy년 MM월", { locale: ko })
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            onSelect(date);
            setOpen(false);
          }}
          disabled={(date) =>
            date > new Date() || date < new Date("1900-01-01")
          }
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleChange = (
    field: keyof AnnouncementFilter,
    value: string | string[] | number,
  ) => {
    onFilterChange({ ...filters, [field]: value, page: 1 });
  };

  const handleReset = () => {
    onFilterChange({
      brtcCode: "",
      signguCode: [],
      targetGroup: [],
      houseType: [],
      suplyType: [],
      minArea: 0,
      maxArea: 9999,
      yearMtBegin: "",
      yearMtEnd: "",
      announcementName: "",
      announcementStatus: [],
      eligibilityStatus: [],
      page: 1,
      pageSize: 12,
      sort: filters.sort,
    });
  };

  const handleAreaSelect = (values: string[]) => {
    if (values.length === 0) {
      // 전체 선택: 두 값을 한 번에 업데이트
      onFilterChange({
        ...filters,
        minArea: 0,
        maxArea: 9999,
        page: 1,
      });
    } else {
      const selectedArea = AREA_OPTIONS.find((opt) => opt.label === values[0]);
      if (selectedArea) {
        // 특정 면적 선택: 두 값을 한 번에 업데이트
        onFilterChange({
          ...filters,
          minArea: selectedArea.min,
          maxArea: selectedArea.max,
          page: 1,
        });
      }
    }
  };

  // 현재 선택된 면적 옵션 가져오기
  const currentAreaSelection = AREA_OPTIONS.find((opt) => {
    // 정확한 매칭을 위한 반올림 처리
    const minArea = filters.minArea ?? 0;
    const maxArea = filters.maxArea ?? 9999;
    const minMatch = Math.abs(minArea - opt.min) < 0.01;
    const maxMatch = Math.abs(maxArea - opt.max) < 0.01;
    return minMatch && maxMatch;
  });
  const selectedAreaValues =
    currentAreaSelection && currentAreaSelection.label !== "전체"
      ? [currentAreaSelection.label]
      : [];

  // 광역시도 옵션 준비
  const brtcOptions = BRTC_LIST.filter((item) => item.code !== "").map(
    (item) => ({
      value: item.code,
      label: item.name,
    }),
  );

  // 시군구 옵션 준비 (선택된 광역시도에 따라)
  const signguOptions = (SIGNGU_LIST[filters.brtcCode || ""] || [])
    .filter((item) => item.code !== "")
    .map((item) => ({
      value: item.code,
      label: item.name,
    }));

  // 기타 옵션들 준비
  const targetGroupOptions = TARGET_GROUPS.map((item) => ({
    value: item,
    label: item,
  }));

  const suplyTypeOptions = SUPLY_TYPES.map((item) => ({
    value: item,
    label: item,
  }));

  const houseTypeOptions = HOUSE_TYPES.map((item) => ({
    value: item,
    label: item,
  }));

  const areaOptions = AREA_OPTIONS.filter((item) => item.label !== "전체").map(
    (item) => ({
      value: item.label,
      label: item.label,
    }),
  );

  const statusOptions = ANNOUNCEMENT_STATUSES.map((item) => ({
    value: item,
    label: item,
  }));

  const eligibilityOptions = ELIGIBILITY_STATUSES.map((item) => ({
    value: item,
    label: item,
  }));

  // 날짜 변환 함수
  const parseYearMonth = (yearMonth: string): Date | undefined => {
    if (!yearMonth) return undefined;
    const [year, month] = yearMonth.split("-");
    return new Date(parseInt(year), parseInt(month) - 1);
  };

  const formatYearMonth = (date: Date | undefined): string => {
    if (!date) return "";
    return format(date, "yyyy-MM");
  };

  // 활성 필터 개수 계산
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.brtcCode) count++;
    if (filters.signguCode && filters.signguCode.length > 0) count++;
    if (filters.targetGroup && filters.targetGroup.length > 0) count++;
    if (filters.houseType && filters.houseType.length > 0) count++;
    if (filters.suplyType && filters.suplyType.length > 0) count++;
    if (filters.minArea !== 0 || filters.maxArea !== 9999) count++;
    if (filters.yearMtBegin) count++;
    if (filters.yearMtEnd) count++;
    if (filters.announcementName) count++;
    if (filters.announcementStatus && filters.announcementStatus.length > 0)
      count++;
    if (filters.eligibilityStatus && filters.eligibilityStatus.length > 0)
      count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
      {/* 헤더 - 항상 표시 */}
      <div className="flex items-center justify-between p-2 px-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <ListFilter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            필터
          </h3>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFiltersCount}개 적용
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* 필터 내용 - 접기/펼치기 가능 */}
      {!isCollapsed && (
        <div className="p-4">
          {/* 첫 번째 줄 - 테이블 순서와 일치 */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
            {/* 공고상태 선택 - 테이블 첫 번째 열 */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                공고상태
              </label>
              <MultiSelect
                placeholder="공고상태 선택"
                options={statusOptions}
                selected={filters.announcementStatus || []}
                onChange={(values) =>
                  handleChange("announcementStatus", values)
                }
                searchPlaceholder="공고상태 검색..."
              />
            </div>

            {/* 충족유무 선택 - 테이블 두 번째 열 */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                충족유무
              </label>
              <MultiSelect
                placeholder="충족유무 선택"
                options={eligibilityOptions}
                selected={filters.eligibilityStatus || []}
                onChange={(values) => handleChange("eligibilityStatus", values)}
                searchPlaceholder="충족유무 검색..."
              />
            </div>

            {/* 광역시도 선택 - 테이블 세 번째 열 (위치) */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                광역시도
              </label>
              <MultiSelect
                placeholder="광역시도 선택"
                options={brtcOptions}
                selected={filters.brtcCode ? [filters.brtcCode] : []}
                onChange={(values) => {
                  // 두 필드를 한 번에 업데이트하여 상태 충돌 방지
                  const newFilters = {
                    ...filters,
                    brtcCode: values[0] || "",
                    signguCode: [], // 광역시도 변경시 시군구 초기화
                    page: 1,
                  };
                  onFilterChange(newFilters);
                }}
                searchPlaceholder="광역시도 검색..."
                singleSelect={true}
              />
            </div>

            {/* 시군구 선택 - 테이블 네 번째 열 (위치) */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                시군구
              </label>
              <MultiSelect
                placeholder="시군구 선택"
                options={signguOptions}
                selected={filters.signguCode || []}
                onChange={(values) => handleChange("signguCode", values)}
                searchPlaceholder="시군구 검색..."
              />
            </div>

            {/* 공고명 검색 - 테이블 다섯 번째 열 */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                공고명
              </label>
              <input
                type="text"
                placeholder="공고명 검색"
                value={filters.announcementName || ""}
                onChange={(e) =>
                  handleChange("announcementName", e.target.value)
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* 임대종류 선택 - 테이블 여섯 번째 열 */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                임대종류
              </label>
              <MultiSelect
                placeholder="임대종류 선택"
                options={suplyTypeOptions}
                selected={filters.suplyType || []}
                onChange={(values) => handleChange("suplyType", values)}
                searchPlaceholder="임대종류 검색..."
              />
            </div>
          </div>

          {/* 두 번째 줄 - 테이블 순서 지속 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
            {/* 주택유형 선택 - 테이블 일곱 번째 열 */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                주택유형
              </label>
              <MultiSelect
                placeholder="주택유형 선택"
                options={houseTypeOptions}
                selected={filters.houseType || []}
                onChange={(values) => handleChange("houseType", values)}
                searchPlaceholder="주택유형 검색..."
              />
            </div>

            {/* 입주대상 선택 - 테이블 여덟 번째 열 */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                입주대상
              </label>
              <MultiSelect
                placeholder="입주대상 선택"
                options={targetGroupOptions}
                selected={filters.targetGroup || []}
                onChange={(values) => handleChange("targetGroup", values)}
                searchPlaceholder="입주대상 검색..."
              />
            </div>

            {/* 전용면적 선택 - 테이블 아홉 번째 열 */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                전용면적
              </label>
              <MultiSelect
                placeholder="전용면적 선택"
                options={areaOptions}
                selected={selectedAreaValues}
                onChange={handleAreaSelect}
                searchPlaceholder="전용면적 검색..."
                singleSelect={true}
              />
            </div>

            {/* 공고 기간 필터 - 테이블 공고일 대응 */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                공고 기간
              </label>
              <div className="flex gap-2">
                <DatePicker
                  placeholder="시작월"
                  selected={parseYearMonth(filters.yearMtBegin || "")}
                  onSelect={(date) =>
                    handleChange("yearMtBegin", formatYearMonth(date))
                  }
                />
                <DatePicker
                  placeholder="종료월"
                  selected={parseYearMonth(filters.yearMtEnd || "")}
                  onSelect={(date) =>
                    handleChange("yearMtEnd", formatYearMonth(date))
                  }
                />
              </div>
            </div>

            {/* 초기화 버튼 */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="gap-2"
                title="필터 초기화"
              >
                <RotateCcw className="h-4 w-4" />
                초기화
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
