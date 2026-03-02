import { useState } from "react";
import { AuthUser } from "../hooks/useAuth";

interface AuthPageProps {
  onLogin: (username: string, password: string) => Promise<AuthUser>;
  onRegister: (username: string, password: string, email: string) => Promise<AuthUser>;
}

type Tab = "login" | "register";

function AuthPage({ onLogin, onRegister }: AuthPageProps) {
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
