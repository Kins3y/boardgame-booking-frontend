import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react";
import axios from "axios";
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

type JwtPayload = {
  exp?: number;
};

function isTokenExpired(token: string): boolean {
  try {
    const payloadPart = token.split(".")[1];

    if (!payloadPart) {
      return true;
    }

    const normalizedPayload = payloadPart
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length +
        ((4 - (normalizedPayload.length % 4)) % 4),
      "="
    );

    const decodedPayload = window.atob(paddedPayload);
    const payloadBytes = Uint8Array.from(
      decodedPayload,
      (character) => character.charCodeAt(0)
    );

    const payload = JSON.parse(
      new TextDecoder().decode(payloadBytes)
    ) as JwtPayload;

    if (typeof payload.exp !== "number") {
      return true;
    }

    // Small safety window prevents sending a token that expires immediately.
    return payload.exp * 1000 <= Date.now() + 5_000;
  } catch {
    return true;
  }
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  }

  async function refreshUser(): Promise<void> {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setUser(null);
      return;
    }

    if (isTokenExpired(token)) {
      logout();
      return;
    }

    try {
      const response = await apiClient.get<User>("/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setUser(response.data);
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        (error.response?.status === 401 ||
          error.response?.status === 403)
      ) {
        logout();
        return;
      }

      // Do not delete tokens on a temporary network/backend failure.
      throw error;
    }
  }

  async function login(
    accessToken: string,
    refreshToken?: string
  ): Promise<void> {
    localStorage.setItem("access_token", accessToken);

    if (refreshToken) {
      localStorage.setItem("refresh_token", refreshToken);
    } else {
      localStorage.removeItem("refresh_token");
    }

    await refreshUser();
  }

  useEffect(() => {
    async function loadCurrentUser() {
      const token = localStorage.getItem("access_token");

      try {
        if (!token) {
          setUser(null);
          return;
        }

        if (isTokenExpired(token)) {
          logout();
          return;
        }

        await refreshUser();
      } catch (error) {
        // A temporary Render/network failure must not destroy the saved session.
        console.error("Failed to restore the current user:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    void loadCurrentUser();
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
