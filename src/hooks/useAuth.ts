import { useState, useEffect, useCallback } from "react";

export interface AuthUser {
  id: number;
  username: string;
  role: "admin" | "user";
}

const TOKEN_KEY = "bike_auth_token";

function getApiBase() {
  return process.env.REACT_APP_API_URL || "";
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 앱 시작 시 저장된 토큰으로 유저 복원
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${getApiBase()}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
        else localStorage.removeItem(TOKEN_KEY);
      })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch(`${getApiBase()}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "로그인 실패");
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user as AuthUser;
  }, []);

  const register = useCallback(async (username: string, password: string, email: string) => {
    const res = await fetch(`${getApiBase()}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "회원가입 실패");
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user as AuthUser;
  }, []);

  const googleLogin = useCallback(async (credential: string) => {
    const res = await fetch(`${getApiBase()}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Google 로그인 실패");
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return data.user as AuthUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const getToken = useCallback(() => localStorage.getItem(TOKEN_KEY), []);

  return { user, loading, login, register, googleLogin, logout, getToken };
}
