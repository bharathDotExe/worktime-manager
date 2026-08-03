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
  const isManager = user?.role === "manager";
  const sidebarTone = "bg-[#105BFA]";
  const contentWidth = isManager ? "max-w-[1440px]" : "max-w-7xl";

  const nav = (
    <nav className="flex flex-col gap-1.5 mt-2">
      {links.map((l) => {
        const active = pathname === l.to;
        return (
          <Link
            key={l.to}
            to={l.to}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-[14px] font-semibold transition-all ${
              active
                ? "bg-white/10 text-white shadow-sm border border-white/10"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon name={l.icon} className="h-[20px] w-[20px] shrink-0" />
            <span className="truncate tracking-wide">{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-elms-bg lg:flex">
      {/* Sidebar — desktop */}
      <aside className={`sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col p-4 lg:flex ${sidebarTone}`}>
        <Link to="/" className="mb-6 flex items-center gap-2 px-2 py-2 text-white">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 font-mono text-sm font-bold">
            E
          </span>
          <span className="font-display text-xl font-bold tracking-tight">ELMS</span>
        </Link>
        {nav}
        <div className="mt-auto overflow-hidden rounded-[20px] bg-[#1665F8] p-5 text-white relative shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
          <div className="mb-3 mt-1 flex justify-center h-[70px]">
            <img src="/realistic_plant.png" alt="Decorative Plant" className="h-full w-auto object-contain drop-shadow-md mix-blend-normal" />
          </div>
          <p className="text-[16px] font-bold tracking-tight mt-2">Need help?</p>
          <p className="mt-1 text-[13px] text-white/90 leading-snug">Check our help center</p>
          <button className="mt-4 flex w-full items-center justify-between text-[13px] font-semibold text-white transition-opacity hover:opacity-80">
            Visit Help Center 
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3.33331 8H12.6666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 3.33337L12.6667 8.00004L8 12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* Sidebar — mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-elms-ink/50" onClick={() => setOpen(false)} />
          <aside className={`absolute inset-y-0 left-0 flex w-64 flex-col p-4 ${sidebarTone}`}>
            <span className="mb-6 px-2 py-2 font-display text-xl font-bold text-white">ELMS</span>
            {nav}
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1 relative bg-[#FAFAFA]">
        <header className={`absolute top-0 inset-x-0 mx-auto w-full ${contentWidth} px-8 pt-8 flex items-center justify-end gap-6 z-30 pointer-events-none`}>
          <div className="pointer-events-auto flex items-center gap-6">
            <button className="relative text-slate-400 hover:text-slate-600 transition">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="absolute -top-1 -right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#1769F0] text-[10px] font-bold text-white border-2 border-[#FAFAFA]">3</span>
            </button>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-6 cursor-pointer">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#E7F2EC] text-sm font-bold uppercase text-elms-primary">
                {user?.username?.slice(0, 2)}
              </span>
              <div className="hidden text-left sm:block">
                <p className="text-[14px] font-bold leading-tight text-elms-ink">Arjun Mehta</p>
                <p className="text-[12px] font-medium text-slate-400">HR Manager</p>
              </div>
              <svg className="h-4 w-4 text-slate-400 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </header>

        <main className={`mx-auto w-full ${contentWidth} px-8 pt-8 pb-10`}>{children}</main>
      </div>
    </div>
  );
}
