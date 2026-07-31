import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Layout({ children, links = [] }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
          <span className="truncate text-lg font-bold text-accent-600">ELMS</span>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">
              {user?.username} · <span className="capitalize">{user?.role}</span>
            </span>
            <button onClick={logout} className="btn-ghost shrink-0">
              Log out
            </button>
          </div>
        </div>

        <nav className="mx-auto -mb-px flex max-w-6xl gap-1 overflow-x-auto px-3 pb-2 sm:px-4">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                pathname === l.to
                  ? "bg-accent-50 text-accent-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
