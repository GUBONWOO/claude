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

  const kakaoLogin = useCallback((): Promise<AuthUser> => {
    return new Promise((resolve, reject) => {
      const popup = window.open(
        `${getApiBase()}/auth/kakao`,
        "kakaoLogin",
        "width=500,height=700,left=200,top=100"
      );
      const handler = (e: MessageEvent) => {
        if (e.data?.type !== "KAKAO_LOGIN") return;
        window.removeEventListener("message", handler);
        const { token } = e.data;
        if (!token) { reject(new Error("카카오 로그인 실패")); return; }
        fetch(`${getApiBase()}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => (r.ok ? r.json() : Promise.reject()))
          .then((data) => {
            localStorage.setItem(TOKEN_KEY, token);
            setUser(data.user);
            resolve(data.user as AuthUser);
          })
          .catch(() => reject(new Error("카카오 로그인 실패")));
      };
      window.addEventListener("message", handler);
      const timer = setInterval(() => {
        if (popup?.closed) {
          clearInterval(timer);
          window.removeEventListener("message", handler);
          reject(new Error("카카오 로그인이 취소되었습니다"));
        }
      }, 500);
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const getToken = useCallback(() => localStorage.getItem(TOKEN_KEY), []);

  return { user, loading, login, register, googleLogin, kakaoLogin, logout, getToken };
}
