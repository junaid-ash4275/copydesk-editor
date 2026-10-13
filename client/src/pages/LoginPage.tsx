import { FormEvent, MouseEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { DEMO_ACCOUNTS } from "../api/auth";
import { useAuth } from "../auth/AuthProvider";
import { ApiError } from "../api/http";

export function LoginPage() {
  const { user, ready, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("alex@ajaia.dev");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (ready && user) return <Navigate to="/" replace />;

  async function authenticate(nextEmail: string, nextPassword: string) {
    setBusy(true);
    setError(null);
    try {
      await login(nextEmail, nextPassword);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void authenticate(email, password);
  }

  function onDemo(event: MouseEvent<HTMLButtonElement>, account: (typeof DEMO_ACCOUNTS)[number]) {
    event.preventDefault();
    setEmail(account.email);
    setPassword(account.password);
    void authenticate(account.email, account.password);
  }

  return (
    <div className="login">
      <aside className="login-panel">
        <div className="login-brand">
          <div className="wordmark">Copydesk</div>
          <div className="wordmark-sub">Shared drafts</div>
        </div>
        <p className="login-lede">Write a draft, mark it up, and hand it to the next reader.</p>
        <p className="login-note">
          Seeded accounts are listed on the right. Use Alex to own a document, then Blair to open it
          as a collaborator.
        </p>
      </aside>
      <main className="login-main">
        <div className="login-card">
          <h1>Sign in</h1>
          <p className="helper" style={{ marginTop: 8 }}>
            Password for every demo account is <code>demo1234</code>.
          </p>
          <form onSubmit={onSubmit}>
            <label className="field">
              <span>Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                type="email"
                required
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                type="password"
                required
              />
            </label>
            {error ? <p className="err">{error}</p> : null}
            <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="demo-list">
            <h2>Demo accounts</h2>
            {DEMO_ACCOUNTS.map((account) => (
              <button key={account.email} className="demo-row" type="button" onClick={(event) => onDemo(event, account)}>
                <span>
                  <strong>{account.name}</strong>
                  <span>{account.email}</span>
                </span>
                <em>{account.role}</em>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
