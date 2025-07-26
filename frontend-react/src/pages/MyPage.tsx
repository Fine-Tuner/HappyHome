import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save, User, Home, LogIn, LogOut } from "lucide-react";
import ThemeToggle from "../features/theme/components/ThemeToggle";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface UserProfile {
  age: number | undefined;
  maritalStatus: string;
  marriageYears: number | undefined;
  hasChildren: boolean;
  childrenCount: number | undefined;
  monthlyIncome: number | undefined;
  totalAssets: number | undefined;
  currentAddress: string;
  workAddress: string;
  hasOwnedHouse: boolean;
  specialSupplyTypes: string[];
}

export default function MyPage() {
  const { user, isLoggedIn, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    age: undefined,
    maritalStatus: "",
    marriageYears: undefined,
    hasChildren: false,
    childrenCount: undefined,
    monthlyIncome: undefined,
    totalAssets: undefined,
    currentAddress: "",
    workAddress: "",
    hasOwnedHouse: false,
    specialSupplyTypes: [],
  });

  const [isSaved, setIsSaved] = useState(false);

  // 페이지 로드 시 저장된 프로필 불러오기
  useEffect(() => {
    const savedProfile = localStorage.getItem("userProfile");
    if (savedProfile) {
      try {
        const parsedProfile = JSON.parse(savedProfile);
        setProfile(parsedProfile);
      } catch (error) {
        console.error("저장된 프로필을 불러오는데 실패했습니다:", error);
      }
    }
  }, []);

  const handleSave = () => {
    // TODO: 실제 저장 로직 구현
    localStorage.setItem("userProfile", JSON.stringify(profile));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSpecialSupplyToggle = (type: string) => {
    setProfile((prev) => ({
      ...prev,
      specialSupplyTypes: prev.specialSupplyTypes.includes(type)
        ? prev.specialSupplyTypes.filter((t) => t !== type)
        : [...prev.specialSupplyTypes, type],
    }));
  };

  const specialSupplyOptions = [
    "대학생",
    "신혼부부",
    "주거취약계층",
    "저소득층",
    "다자녀가구",
    "장애인",
    "국가유공자",
    "한부모가족",
    "노인",
    "청년",
  ];

  const maritalStatusOptions = [
    { value: "single", label: "미혼" },
    { value: "married", label: "기혼" },
    { value: "divorced", label: "이혼" },
    { value: "widowed", label: "배우자 사망" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="container mx-auto">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                마이페이지
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/announcements">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Home className="h-4 w-4" />
                  홈으로
                </Button>
              </Link>
              {isLoggedIn ? (
                <>
                  {user && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span>
                        안녕하세요,{" "}
                        {user.display_name || user.first_name || "사용자"}님
                      </span>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4" />
                    로그아웃
                  </Button>
                </>
              ) : (
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LogIn className="h-4 w-4" />
                    로그인
                  </Button>
                </Link>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* 정보 배너 */}
          <div className="mb-8 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-600 dark:text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  임대주택 신청 자격 확인을 위한 정보를 입력해주세요.
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                  입력하신 정보는 공고문 매칭 시 활용됩니다.
                </p>
              </div>
            </div>
          </div>

          {/* 프로필 카드 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="space-y-8">
              {/* 기본 정보 */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  기본 정보
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 나이 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      나이
                    </label>
                    <input
                      type="number"
                      placeholder="만 나이를 입력하세요"
                      value={profile.age || ""}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          age: parseInt(e.target.value) || undefined,
                        }))
                      }
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  {/* 혼인상태 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      혼인상태
                    </label>
                    <Select
                      value={profile.maritalStatus}
                      onValueChange={(value) =>
                        setProfile((prev) => ({
                          ...prev,
                          maritalStatus: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="혼인상태를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {maritalStatusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 신혼부부 년차 (기혼인 경우에만) */}
                  {profile.maritalStatus === "married" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        결혼 년차
                      </label>
                      <input
                        type="number"
                        placeholder="결혼한 지 몇 년인지 입력하세요"
                        value={profile.marriageYears || ""}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            marriageYears:
                              parseInt(e.target.value) || undefined,
                          }))
                        }
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  )}

                  {/* 자녀 유무 */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      자녀 유무
                    </label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasChildren"
                        checked={profile.hasChildren}
                        onCheckedChange={(checked) =>
                          setProfile((prev) => ({
                            ...prev,
                            hasChildren: !!checked,
                            childrenCount: checked
                              ? prev.childrenCount
                              : undefined,
                          }))
                        }
                      />
                      <label
                        htmlFor="hasChildren"
                        className="text-sm font-normal cursor-pointer"
                      >
                        자녀가 있습니다
                      </label>
                    </div>
                    {profile.hasChildren && (
                      <input
                        type="number"
                        placeholder="자녀 수를 입력하세요"
                        value={profile.childrenCount || ""}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            childrenCount:
                              parseInt(e.target.value) || undefined,
                          }))
                        }
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* 경제 정보 */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  경제 정보
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 월 소득 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      월 소득 (만원)
                    </label>
                    <input
                      type="number"
                      placeholder="월 소득을 만원 단위로 입력하세요"
                      value={profile.monthlyIncome || ""}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          monthlyIncome: parseInt(e.target.value) || undefined,
                        }))
                      }
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  {/* 총 자산 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      총 자산 (만원)
                    </label>
                    <input
                      type="number"
                      placeholder="총 자산을 만원 단위로 입력하세요"
                      value={profile.totalAssets || ""}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          totalAssets: parseInt(e.target.value) || undefined,
                        }))
                      }
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* 주소 정보 */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  주소 정보
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 현재 거주지 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      현재 거주지
                    </label>
                    <input
                      type="text"
                      placeholder="현재 거주하고 있는 주소를 입력하세요"
                      value={profile.currentAddress}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          currentAddress: e.target.value,
                        }))
                      }
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  {/* 직장 주소 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      직장 주소
                    </label>
                    <input
                      type="text"
                      placeholder="직장 주소를 입력하세요"
                      value={profile.workAddress}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          workAddress: e.target.value,
                        }))
                      }
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* 주택 소유 정보 */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  주택 소유 정보
                </h2>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasOwnedHouse"
                    checked={profile.hasOwnedHouse}
                    onCheckedChange={(checked) =>
                      setProfile((prev) => ({
                        ...prev,
                        hasOwnedHouse: !!checked,
                      }))
                    }
                  />
                  <label
                    htmlFor="hasOwnedHouse"
                    className="text-sm font-normal cursor-pointer"
                  >
                    현재 주택을 소유하고 있습니다
                  </label>
                </div>
              </div>

              {/* 특별공급 대상 */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  특별공급 대상
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  해당되는 특별공급 대상을 모두 선택해주세요.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {specialSupplyOptions.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={profile.specialSupplyTypes.includes(type)}
                        onCheckedChange={() => handleSpecialSupplyToggle(type)}
                      />
                      <label
                        htmlFor={type}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
                {profile.specialSupplyTypes.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      선택된 대상:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {profile.specialSupplyTypes.map((type) => (
                        <Badge key={type} variant="secondary">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 저장 버튼 */}
              <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button onClick={handleSave} className="gap-2">
                  <Save className="h-4 w-4" />
                  {isSaved ? "저장 완료!" : "정보 저장"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
