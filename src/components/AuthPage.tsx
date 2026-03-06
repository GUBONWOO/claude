import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { AuthUser } from "../hooks/useAuth";

interface AuthPageProps {
  onLogin: (username: string, password: string) => Promise<AuthUser>;
  onRegister: (username: string, password: string, email: string) => Promise<AuthUser>;
  onGoogleLogin: (credential: string) => Promise<AuthUser>;
  onKakaoLogin: () => Promise<AuthUser>;
}

type Tab = "login" | "register";

function AuthPage({ onLogin, onRegister, onGoogleLogin, onKakaoLogin }: AuthPageProps) {
  const [tab, setTab] = useState<Tab>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (tab === "login") {
        await onLogin(username, password);
      } else {
        await onRegister(username, password, email);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return;
    setError("");
    try {
      await onGoogleLogin(credentialResponse.credential);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google 로그인 실패");
    }
  };

  const handleKakaoLogin = async () => {
    setError("");
    try {
      await onKakaoLogin();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "카카오 로그인 실패");
    }
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setError("");
    setUsername("");
    setPassword("");
    setEmail("");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="app-header__logo">Bike Search</span>
        </div>

        <div className="auth-google">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google 로그인에 실패했습니다")}
            width="360"
            text="signin_with"
            shape="rectangular"
          />
        </div>

        <div className="auth-kakao">
          <button className="kakao-login-btn" type="button" onClick={handleKakaoLogin}>
            <img
              src="https://k.kakaocdn.net/14/dn/btroDszwNrM/I6efHub1SN5KCJqLm1Ovx1/o.jpg"
              alt="카카오 로그인"
              width="22"
              height="22"
            />
            카카오 로그인
          </button>
        </div>

        <div className="auth-divider">
          <span>또는</span>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === "login" ? "auth-tab--active" : ""}`}
            onClick={() => switchTab("login")}
            type="button"
          >
            로그인
          </button>
          <button
            className={`auth-tab ${tab === "register" ? "auth-tab--active" : ""}`}
            onClick={() => switchTab("register")}
            type="button"
          >
            회원가입
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">아이디</label>
            <input
              className="auth-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디를 입력하세요"
              autoComplete="username"
              required
            />
          </div>

          {tab === "register" && (
            <div className="auth-field">
              <label className="auth-label">이메일</label>
              <input
                className="auth-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력하세요"
                autoComplete="email"
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label">비밀번호</label>
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={tab === "register" ? "6자 이상 입력하세요" : "비밀번호를 입력하세요"}
              autoComplete={tab === "login" ? "current-password" : "new-password"}
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? "처리 중..." : tab === "login" ? "로그인" : "회원가입"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthPage;
