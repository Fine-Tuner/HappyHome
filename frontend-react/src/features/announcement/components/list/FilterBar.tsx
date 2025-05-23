import { useState, useRef, useEffect } from "react";
import { AnnouncementFilter } from "../types/announcement";

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
  { label: "40m² 미만", min: 0, max: 40 },
  { label: "40~60m² 미만", min: 40, max: 60 },
  { label: "60~85m² 미만", min: 60, max: 85 },
  { label: "85m² 초과", min: 85, max: 9999 },
];

const RENT_CODE_OPTIONS = [
  { code: "01", label: "5만원 미만" },
  { code: "02", label: "5~10만원 미만" },
  { code: "03", label: "10~20만원 미만" },
  { code: "04", label: "20~30만원 미만" },
  { code: "05", label: "30만원 이상" },
];

function DropdownMultiSelect({
  options,
  value,
  onChange,
  label,
  allLabel = "전체",
  className = "",
  single = false,
}: {
  options: string[];
  value: string[];
  onChange: (val: string[]) => void;
  label: string;
  allLabel?: string;
  className?: string;
  single?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);
  const isAll = value.length === 0;
  const summary = isAll
    ? `전체 ${label}`
    : value.length === 1
      ? value[0]
      : `${value[0]} 외 ${value.length - 1}개`;
  return (
    <div className={`relative ${className} min-w-[140px]`} ref={ref}>
      <button
        type="button"
        className="h-8 w-full flex justify-between items-center px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{summary}</span>
        <svg
          className={`w-4 h-4 ml-2 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-full min-w-[140px] rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg max-h-60 overflow-y-auto">
          {single ? (
            <label className="relative flex items-center gap-2 cursor-pointer group px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">
              <span className="relative w-5 h-5 flex items-center justify-center">
                <input
                  type="radio"
                  checked={isAll}
                  onChange={() => {
                    onChange([]);
                    setOpen(false);
                  }}
                  className="appearance-none w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-800 transition-colors group-hover:border-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-gray-700 checked:bg-blue-500 checked:border-blue-500"
                />
                {isAll && (
                  <svg
                    className="absolute w-4 h-4 text-blue-500 pointer-events-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    fill="none"
                    viewBox="0 0 20 20"
                  >
                    <circle cx="10" cy="10" r="5" fill="currentColor" />
                  </svg>
                )}
              </span>
              <span className="text-xs text-gray-900 dark:text-gray-100">
                {allLabel}
              </span>
            </label>
          ) : (
            <label className="relative flex items-center gap-2 cursor-pointer group px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">
              <span className="relative w-5 h-5 flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={isAll}
                  onChange={() => onChange([])}
                  className="appearance-none w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-800 transition-colors group-hover:border-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-gray-700 checked:bg-blue-500 checked:border-blue-500"
                />
                {isAll && (
                  <svg
                    className="absolute w-4 h-4 text-blue-500 pointer-events-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    fill="none"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M6 10l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span className="text-xs text-gray-900 dark:text-gray-100">
                {allLabel}
              </span>
            </label>
          )}
          {options
            .filter((opt) => opt !== allLabel)
            .map((opt) => (
              <label
                key={opt}
                className="relative flex items-center gap-2 cursor-pointer group px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <span className="relative w-5 h-5 flex items-center justify-center">
                  {single ? (
                    <input
                      type="radio"
                      checked={value[0] === opt}
                      onChange={() => {
                        onChange([opt]);
                        setOpen(false);
                      }}
                      className="appearance-none w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-800 transition-colors group-hover:border-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-gray-700 checked:bg-blue-500 checked:border-blue-500"
                    />
                  ) : (
                    <input
                      type="checkbox"
                      checked={value.includes(opt)}
                      onChange={() => {
                        if (value.includes(opt)) {
                          onChange(value.filter((v) => v !== opt));
                        } else {
                          onChange([...value, opt]);
                        }
                      }}
                      className="appearance-none w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-800 transition-colors group-hover:border-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-gray-700 checked:bg-blue-500 checked:border-blue-500"
                    />
                  )}
                  {!single && value.includes(opt) && (
                    <svg
                      className="absolute w-4 h-4 text-blue-500 pointer-events-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                      fill="none"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M6 10l3 3 5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  {single && value[0] === opt && (
                    <svg
                      className="absolute w-4 h-4 text-blue-500 pointer-events-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                      fill="none"
                      viewBox="0 0 20 20"
                    >
                      <circle cx="10" cy="10" r="5" fill="currentColor" />
                    </svg>
                  )}
                </span>
                <span className="text-xs truncate text-gray-900 dark:text-gray-100">
                  {opt}
                </span>
              </label>
            ))}
        </div>
      )}
    </div>
  );
}

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const handleReset = () => {
    onFilterChange({
      brtcCode: "",
      signguCode: [],
      targetGroup: [],
      houseType: [],
      suplyType: [],
      minArea: 0,
      maxArea: 9999,
      rentCodes: [],
      yearMtBegin: "",
      yearMtEnd: "",
      announcementName: "",
      page: 1,
      pageSize: 12,
      sort: "latest",
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    if (name === "brtcCode") newFilters.signguCode = [];
    onFilterChange(newFilters);
  };

  // 토글 그룹 핸들러
  const handleToggle = (name: string, values: string[]) => {
    const newFilters = { ...filters, [name]: values };
    onFilterChange(newFilters);
  };

  // 전용면적 핸들러
  const handleAreaSelect = (min: number, max: number) => {
    const newFilters = { ...filters, minArea: min, maxArea: max };
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-4">
      <div className="flex flex-row flex-wrap gap-2 items-end">
        <DropdownMultiSelect
          options={BRTC_LIST.map((o) => o.name)}
          value={
            filters.brtcCode === ""
              ? []
              : [
                  BRTC_LIST.find((o) => o.code === filters.brtcCode)?.name ||
                    "전체",
                ]
          }
          onChange={(vals) => {
            const code = BRTC_LIST.find((o) => o.name === vals[0])?.code || "";
            const newFilters = { ...filters, brtcCode: code, signguCode: [] };
            onFilterChange(newFilters);
          }}
          label="광역시도"
          single
          className="h-8 min-w-[90px] max-w-[140px] flex-1"
        />
        <DropdownMultiSelect
          options={(
            SIGNGU_LIST[String(filters.brtcCode) || ""] || [{ name: "전체" }]
          ).map((o: any) => o.name)}
          value={
            Array.isArray(filters.signguCode)
              ? filters.signguCode.map(
                  (code) =>
                    (
                      SIGNGU_LIST[String(filters.brtcCode) || ""] || [
                        { code: "", name: "전체" },
                      ]
                    ).find((o: any) => o.code === code)?.name || "전체",
                )
              : []
          }
          onChange={(vals) => {
            // name 배열을 code 배열로 변환
            const codes = (
              SIGNGU_LIST[String(filters.brtcCode) || ""] || [
                { code: "", name: "전체" },
              ]
            )
              .filter((o: any) => vals.includes(o.name))
              .map((o: any) => o.code);
            const newFilters = { ...filters, signguCode: codes };
            onFilterChange(newFilters);
          }}
          label="시군구"
          single={false}
          className="h-8 min-w-[90px] max-w-[140px] flex-1"
        />
        <DropdownMultiSelect
          options={TARGET_GROUPS}
          value={filters.targetGroup || []}
          onChange={(vals) => handleToggle("targetGroup", vals)}
          label="입주대상"
          className="h-8 min-w-[90px] max-w-[140px] flex-1"
        />
        <DropdownMultiSelect
          options={SUPLY_TYPES}
          value={filters.suplyType || []}
          onChange={(vals) => handleToggle("suplyType", vals)}
          label="임대종류"
          className="h-8 min-w-[90px] max-w-[140px] flex-1"
        />
        <DropdownMultiSelect
          options={HOUSE_TYPES}
          value={filters.houseType || []}
          onChange={(vals) => handleToggle("houseType", vals)}
          label="주택유형"
          className="h-8 min-w-[90px] max-w-[140px] flex-1"
        />
        <DropdownMultiSelect
          options={RENT_CODE_OPTIONS.map((o) => o.label)}
          value={
            (filters as any).rentCodes
              ? (filters as any).rentCodes.map(
                  (code: any) =>
                    RENT_CODE_OPTIONS.find((o) => o.code === code)?.label ||
                    code,
                )
              : []
          }
          onChange={(vals) => {
            // label -> code 매핑
            const codes =
              vals.includes("전체") || vals.length === 0
                ? []
                : RENT_CODE_OPTIONS.filter((o) => vals.includes(o.label)).map(
                    (o) => o.code,
                  );
            handleToggle("rentCodes", codes);
          }}
          label="월임대료"
          className="h-8 min-w-[90px] max-w-[140px] flex-1"
        />
        <DropdownMultiSelect
          options={AREA_OPTIONS.map((opt) => opt.label)}
          value={(() => {
            const selected = AREA_OPTIONS.find(
              (opt) =>
                filters.minArea === opt.min && filters.maxArea === opt.max,
            );
            return selected && selected.label !== "전체"
              ? [selected.label]
              : [];
          })()}
          onChange={(vals) => {
            const area =
              AREA_OPTIONS.find((opt) => opt.label === vals[0]) ||
              AREA_OPTIONS[0];
            handleAreaSelect(area.min, area.max);
          }}
          label="전용면적"
          single
          className="h-8 min-w-[90px] max-w-[140px] flex-1"
        />
        <input
          type="month"
          name="yearMtBegin"
          value={filters.yearMtBegin}
          onChange={handleChange}
          className="h-8 appearance-none rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 px-2 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-w-[90px] max-w-[140px] flex-1"
          placeholder="시작월"
        />
        <input
          type="month"
          name="yearMtEnd"
          value={filters.yearMtEnd}
          onChange={handleChange}
          className="h-8 appearance-none rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 px-2 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-w-[90px] max-w-[140px] flex-1"
          placeholder="종료월"
        />
        <input
          type="text"
          name="announcementName"
          value={filters.announcementName}
          onChange={handleChange}
          className="h-8 appearance-none rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 px-2 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-w-[90px] max-w-[140px] flex-1"
          placeholder="공고명"
        />
        <div className="flex items-center gap-1 ml-2">
          <button
            type="button"
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-xs"
            onClick={handleReset}
            title="초기화"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
