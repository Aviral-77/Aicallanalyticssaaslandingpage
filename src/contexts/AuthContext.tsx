import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, User } from "../lib/api";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("repostai_token")
  );
  const [isLoading, setIsLoading] = useState(!!localStorage.getItem("repostai_token"));

  // Validate stored token on mount
  useEffect(() => {
    if (!token) return;
    api
      .me()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("repostai_token");
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const persist = (tok: string, u: User) => {
    localStorage.setItem("repostai_token", tok);
    setToken(tok);
    setUser(u);
  };

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    persist(res.access_token, res.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.register(name, email, password);
    persist(res.access_token, res.user);
  };

  const logout = () => {
    localStorage.removeItem("repostai_token");
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const updated = await api.me();
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
