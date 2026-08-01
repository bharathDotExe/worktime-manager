import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { errorMessage } from "../api/client";

export default function AuthModal({ initialTab = "login", onClose }) {
  const [tab, setTab] = useState(initialTab);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Close on escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (tab === "register") {
      if (form.password.length < 8) return setError("Password must be at least 8 characters");
      if (form.password !== form.confirm) return setError("Passwords do not match");
    }

    setBusy(true);
    try {
      if (tab === "login") {
        const me = await login(form.username.trim(), form.password);
        navigate(me.role === "manager" ? "/manager/requests" : "/dashboard", { replace: true });
      } else {
        await register(form.username.trim(), form.password);
        navigate("/dashboard", { replace: true });
      }
      onClose();
    } catch (err) {
      setError(errorMessage(err, `Unable to ${tab === "login" ? "sign in" : "register"}`));
    } finally {
      setBusy(false);
    }
  }

  const isLogin = tab === "login";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div 
        className="absolute inset-0 bg-elms-ink/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-sm rounded-2xl border border-elms-line bg-elms-surface p-6 shadow-2xl sm:p-8 animate-rise">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-elms-muted transition hover:bg-elms-bg hover:text-elms-ink"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>

        <div className="flex items-center gap-4 border-b border-elms-line pb-4">
          <button 
            className={`font-display text-lg font-semibold transition-colors ${isLogin ? "text-elms-ink" : "text-elms-muted hover:text-elms-ink"}`}
            onClick={() => { setTab("login"); setError(""); }}
          >
            Sign in
          </button>
          <button 
            className={`font-display text-lg font-semibold transition-colors ${!isLogin ? "text-elms-ink" : "text-elms-muted hover:text-elms-ink"}`}
            onClick={() => { setTab("register"); setError(""); }}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-elms-ink" htmlFor="username">Username</label>
            <input
              id="username"
              className="w-full rounded-md border border-elms-line bg-elms-surface px-3 py-2 text-sm text-elms-ink outline-none transition focus:border-elms-primary focus:ring-1 focus:ring-elms-primary"
              autoComplete="username"
              minLength={isLogin ? undefined : 3}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-elms-ink" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="w-full rounded-md border border-elms-line bg-elms-surface px-3 py-2 text-sm text-elms-ink outline-none transition focus:border-elms-primary focus:ring-1 focus:ring-elms-primary"
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={isLogin ? undefined : 8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          
          {!isLogin && (
            <div className="elms-reveal">
              <label className="mb-1 block text-sm font-medium text-elms-ink" htmlFor="confirm">Confirm password</label>
              <input
                id="confirm"
                type="password"
                className="w-full rounded-md border border-elms-line bg-elms-surface px-3 py-2 text-sm text-elms-ink outline-none transition focus:border-elms-primary focus:ring-1 focus:ring-elms-primary"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                required
              />
            </div>
          )}

          {error && <p className="rounded-md bg-elms-reject/10 px-3 py-2 text-sm text-elms-reject">{error}</p>}

          <button type="submit" className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-elms-primary px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-ink disabled:opacity-50" disabled={busy}>
            {busy ? (isLogin ? "Signing in…" : "Creating account…") : (isLogin ? "Sign in" : "Create account")}
          </button>
        </form>
      </div>
    </div>
  );
}
