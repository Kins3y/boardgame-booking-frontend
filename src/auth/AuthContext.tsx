import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react";
import { apiClient } from "../api/client";

type User = {
  id: number;
  email: string;
  nickname: string;
  admin_badge: string | null;
};

type AuthContextType = {
  user: User | null;
  login: (accessToken: string, refreshToken?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  }

  async function refreshUser() {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setUser(null);
      return;
    }

    try {
      const response = await apiClient.get<User>("/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setUser(response.data);
    } catch {
      logout();
    }
  }

  async function login(
    accessToken: string,
    refreshToken?: string
  ): Promise<void> {
    localStorage.setItem("access_token", accessToken);

    if (refreshToken) {
      localStorage.setItem("refresh_token", refreshToken);
    }

    await refreshUser();
  }

  useEffect(() => {
    async function loadCurrentUser() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        await refreshUser();
      } finally {
        setIsLoading(false);
      }
    }

    loadCurrentUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        refreshUser,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
