import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, User, LogIn } from "lucide-react";
import ThemeToggle from "../features/theme/components/ThemeToggle";
import { Link } from "react-router-dom";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState<{
    naver: boolean;
    google: boolean;
  }>({
    naver: false,
    google: false,
  });

  const handleNaverLogin = () => {
    setIsLoading((prev) => ({ ...prev, naver: true }));

    // TODO: 실제 네이버 OAuth 로그인 로직 구현
    // window.location.href = "네이버 OAuth URL";

    // 임시: 2초 후 로딩 해제 (실제 구현시 제거)
    setTimeout(() => {
      setIsLoading((prev) => ({ ...prev, naver: false }));
      console.log("네이버 로그인 로직 구현 필요");
    }, 2000);
  };

  const handleGoogleLogin = () => {
    setIsLoading((prev) => ({ ...prev, google: true }));

    // 백엔드의 구글 로그인 엔드포인트로 리디렉트
    window.location.href = "http://localhost:8000/api/v1/login/google/login";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="container mx-auto">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center gap-3">
              <LogIn className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                로그인
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/announcements">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Home className="h-4 w-4" />
                  홈으로
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="pt-20 pb-8 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md px-4">
          {/* 로그인 카드 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-8">
            {/* 웰컴 메시지 */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                환영합니다!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                행복주택 서비스에 로그인하세요
              </p>
            </div>

            {/* 소셜 로그인 버튼들 */}
            <div className="space-y-4">
              {/* 네이버 로그인 */}
              <Button
                onClick={handleNaverLogin}
                disabled={isLoading.naver || isLoading.google}
                className="w-full h-12 bg-[#03C75A] hover:bg-[#02B551] text-white font-medium text-base relative"
              >
                {isLoading.naver ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>로그인 중...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    {/* 네이버 로고 */}
                    <div className="w-5 h-5 bg-white rounded flex items-center justify-center">
                      <span className="text-[#03C75A] font-bold text-sm">
                        N
                      </span>
                    </div>
                    <span>네이버로 로그인</span>
                  </div>
                )}
              </Button>

              {/* 구글 로그인 */}
              <Button
                onClick={handleGoogleLogin}
                disabled={isLoading.naver || isLoading.google}
                variant="outline"
                className="w-full h-12 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-base relative"
              >
                {isLoading.google ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-gray-600 dark:border-gray-300 border-t-transparent rounded-full"></div>
                    <span>로그인 중...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    {/* 구글 로고 */}
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>Google로 로그인</span>
                  </div>
                )}
              </Button>
            </div>

            {/* 구분선 */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
              <span className="px-4 text-sm text-gray-500 dark:text-gray-400">
                또는
              </span>
              <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
            </div>

            {/* 게스트로 계속하기 */}
            <Link to="/announcements">
              <Button
                variant="ghost"
                className="w-full h-12 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium"
              >
                게스트로 계속하기
              </Button>
            </Link>

            {/* 약관 정보 */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                로그인하면{" "}
                <a
                  href="#"
                  className="underline hover:text-gray-700 dark:hover:text-gray-300"
                >
                  서비스 이용약관
                </a>
                과{" "}
                <a
                  href="#"
                  className="underline hover:text-gray-700 dark:hover:text-gray-300"
                >
                  개인정보처리방침
                </a>
                에 동의하는 것으로 간주됩니다.
              </p>
            </div>
          </div>

          {/* 추가 정보 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              계정이 없으신가요?{" "}
              <span className="text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline">
                소셜 로그인으로 자동 가입
              </span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
