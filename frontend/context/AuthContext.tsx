"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";

interface User {
  userId: string;
  name: string;
  email: string;
  role: "STUDENT" | "INSTRUCTOR";
}

interface LoginData {
  email: string;
  password: string;
}

interface IAuthContext {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<IAuthContext | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUserFromApi = useCallback(async (token: string) => {
    try {
      const response = await fetch("http://localhost:5001/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const currentUser = data.user as User;
          localStorage.setItem("user", JSON.stringify(currentUser));
          setUser(currentUser);
          return currentUser;
        }
      }
      throw new Error("Invalid session");
    } catch (error) {
      console.error("Fetching user failed:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const checkUserSession = async () => {
      setLoading(true);

      if (typeof window === "undefined") {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser) as User;
            setUser(parsedUser);
          } catch (e) {
            localStorage.removeItem("user");
          }
        }

        const currentUser = await fetchUserFromApi(token);
        if (!currentUser) {
          setUser(null);
        }
      } catch (error) {
        console.error("Session check failed:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();
  }, [fetchUserFromApi]);

  const login = useCallback(async (data: LoginData) => {
    try {
      const response = await fetch("http://localhost:5001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const res = await response.json();

      if (!response.ok) {
        const error: any = new Error(res.error || "Login failed");
        error.locked = res.locked;
        error.lockoutUntil = res.lockoutUntil;
        error.attemptsLeft = res.attemptsLeft;
        throw error;
      }

      if (!res.success) {
        const error: any = new Error(res.error || "Login failed");
        error.locked = res.locked;
        error.lockoutUntil = res.lockoutUntil;
        error.attemptsLeft = res.attemptsLeft;
        throw error;
      }

      const { token, user: userData } = res;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData as User);

      if (userData.role === "STUDENT") {
        window.location.href = "/courses";
      } else {
        window.location.href = "/dashboard/instructor/courses";
      }
    } catch (err: any) {
      console.error("Login error:", err);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch("http://localhost:5001/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.warn("Logout API failed:", error);
    } finally {
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
