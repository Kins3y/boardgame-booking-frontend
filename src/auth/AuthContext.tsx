import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔐 восстановление сессии при старте
  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get("/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  // 🔐 login (единственный источник установки user)
  const login = async (accessToken: string) => {
    localStorage.setItem("access_token", accessToken);

    try {
      const res = await api.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setUser(res.data);
    } catch (e) {
      logout();
    }
  };

  // 🚪 logout
  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  };

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