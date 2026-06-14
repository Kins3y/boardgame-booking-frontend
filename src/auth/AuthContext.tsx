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
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  }

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setLoading(false);
      return;
    }

    apiClient
      .get<User>("/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then((res) => {
        setUser(res.data);
      })
      .catch(() => {
        logout();
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  async function login(accessToken: string): Promise<void> {
    localStorage.setItem("access_token", accessToken);

    try {
      const res = await apiClient.get<User>("/auth/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      setUser(res.data);
    } catch {
      logout();
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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