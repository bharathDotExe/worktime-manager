import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function Icon({ name, className = "h-5 w-5" }) {
  const paths = {
    dashboard: "M4 4h7v7H4V4zm9 0h7v4h-7V4zM4 13h7v7H4v-7zm9-3h7v10h-7V10z",
    apply: "M12 5v14M5 12h14",
    history: "M12 8v5l3 2M3 12a9 9 0 1 0 9-9 9 9 0 0 0-7.9 4.7M3 4v4h4",
    requests: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    people: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 .01M22 21v-2a4 4 0 0 0-3-3.9",
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={paths[name] || paths.dashboard} />
    </svg>
  );
}

export default function Layout({ children, links = [] }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-1">
      {links.map((l) => {
        const active = pathname === l.to;
        return (
          <Link
            key={l.to}
            to={l.to}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-white/15 text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon name={l.icon} className="h-5 w-5 shrink-0" />
            <span className="truncate">{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-elms-bg lg:flex">
      {/* Sidebar — desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-elms-primary p-4 lg:flex">
        <Link to="/" className="mb-6 flex items-center gap-2 px-2 py-2 text-white">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 font-mono text-sm font-bold">
            E
          </span>
          <span className="font-display text-xl font-bold tracking-tight">ELMS</span>
        </Link>
        {nav}
        <div className="mt-auto rounded-xl bg-white/10 p-4 text-white">
          <p className="text-sm font-semibold">Need help?</p>
          <p className="mt-1 text-xs text-white/70">Check the setup guide in the repo README.</p>
        </div>
      </aside>

      {/* Sidebar — mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-elms-ink/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-elms-primary p-4">
            <span className="mb-6 px-2 py-2 font-display text-xl font-bold text-white">ELMS</span>
            {nav}
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-elms-line bg-elms-surface/95 backdrop-blur">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
            <button
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
              className="shrink-0 rounded-md border border-elms-line px-2 py-2 text-elms-ink lg:hidden"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
            <span className="truncate text-sm text-elms-muted">
              Welcome back, <span className="font-semibold text-elms-ink">{user?.username}</span>
            </span>
            <div className="flex shrink-0 items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold leading-tight text-elms-ink">{user?.username}</p>
                <p className="text-xs capitalize text-elms-muted">{user?.role}</p>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#E7F2EC] text-sm font-bold uppercase text-elms-primary">
                {user?.username?.slice(0, 2)}
              </span>
              <button
                onClick={logout}
                className="shrink-0 rounded-md border border-elms-line bg-elms-surface px-3 py-2 text-sm font-medium text-elms-ink transition hover:bg-elms-bg"
              >
                Log out
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
