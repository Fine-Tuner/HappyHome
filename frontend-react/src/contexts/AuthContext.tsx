import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  income: number | null;
  bookmark_announcement_ids: string[];
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  picture: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isLoggedIn = user !== null;

  // 페이지 로드시 로그인 상태 확인
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);

      // 직접 /users/me API를 호출해서 인증 상태 확인
      // httpOnly 쿠키는 브라우저가 자동으로 포함시킴
      const response = await fetch("http://localhost:8000/api/v1/users/me", {
        method: "GET",
        credentials: "include", // 쿠키 포함
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // 토큰이 유효하지 않거나 없으면 로그아웃 처리
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = () => {
    // 구글 로그인 페이지로 리디렉트
    window.location.href = "http://localhost:8000/api/v1/login/google/login";
  };

  const logout = async () => {
    try {
      // 백엔드 로그아웃 API 호출 (토큰 무효화)
      await fetch("http://localhost:8000/api/v1/login/revoke", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Logout API failed:", error);
    } finally {
      // 클라이언트에서 사용자 상태 초기화
      setUser(null);

      // 쿠키 삭제 (백엔드에서도 삭제되지만 클라이언트에서도 삭제)
      document.cookie =
        "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie =
        "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      // 홈페이지로 리디렉트
      window.location.href = "/announcements";
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...userData } : null));
  };

  const value: AuthContextType = {
    user,
    isLoggedIn,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
