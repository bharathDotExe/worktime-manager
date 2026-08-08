import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/client.js";
import { cacheGet, cacheSet } from "../api/cache";

function Icon({ name, className = "h-5 w-5" }) {
  if (name === "people") {
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
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  const paths = {
    dashboard: "M4 4h7v7H4V4zm9 0h7v4h-7V4zM4 13h7v7H4v-7zm9-3h7v10h-7V10z",
    apply: "M12 5v14M5 12h14",
    history: "M12 8v5l3 2M3 12a9 9 0 1 0 9-9 9 9 0 0 0-7.9 4.7M3 4v4h4",
    requests: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
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
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const mobileNotifRef = useRef(null);
  const desktopNotifRef = useRef(null);
  const mobileProfileRef = useRef(null);
  const desktopProfileRef = useRef(null);
  
  const isManager = user?.role === "manager";
  const sidebarTone = "bg-[#0B6E4F]";
  const contentWidth = isManager ? "max-w-[1440px]" : "max-w-7xl";

  useEffect(() => {
    if (user) {
      // Hydrate instantly from cache
      const cached = cacheGet("notifications");
      if (cached) {
        setNotificationCount(cached.count || 0);
        setNotifications(cached.notifications || []);
      }
      api.get("/leaves/notifications")
        .then(res => {
          const data = res.data;
          cacheSet("notifications", data, 30_000);
          setNotificationCount(data.count || 0);
          setNotifications(data.notifications || []);
        })
        .catch(err => console.error("Could not fetch notifications", err));
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event) {
      const isOutsideNotif = 
        (!mobileNotifRef.current || !mobileNotifRef.current.contains(event.target)) &&
        (!desktopNotifRef.current || !desktopNotifRef.current.contains(event.target));
        
      if (isOutsideNotif) {
        setIsNotifOpen(false);
      }
      
      const isOutsideProfile = 
        (!mobileProfileRef.current || !mobileProfileRef.current.contains(event.target)) &&
        (!desktopProfileRef.current || !desktopProfileRef.current.contains(event.target));
        
      if (isOutsideProfile) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white shadow-sm overflow-hidden">
            <img src="/elms_icon.png" alt="ELMS" className="h-7 w-7 object-contain" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">ELMS</span>
        </Link>
        {nav}
        <div className="mt-auto overflow-visible rounded-[20px] bg-[#0E8B65] p-5 pl-[85px] text-white relative shadow-[0_4px_20px_rgba(0,0,0,0.15)] min-h-[60px] flex items-center">
          <img
            src="/indoor_plant.png"
            alt="Decorative Plant"
            className="absolute -bottom-4 -left-6 w-[150px] h-[180px] object-cover object-bottom drop-shadow-[0_8px_12px_rgba(0,0,0,0.25)] mix-blend-normal pointer-events-none"
          />
          <div className="relative z-10 w-full">
            <button className="flex w-full items-center justify-between text-[13px] font-semibold text-white transition-opacity hover:opacity-80">
              Visit Help Center
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3.33331 8H12.6666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 3.33337L12.6667 8.00004L8 12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar — mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-elms-ink/50" onClick={() => setOpen(false)} />
          <aside className={`absolute inset-y-0 left-0 flex w-64 flex-col p-4 ${sidebarTone}`}>
            <div className="mb-6 flex items-center justify-between px-2 py-2">
              <span className="font-display text-xl font-bold text-white">ELMS</span>
              <button
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-white/70 hover:bg-white/10 transition"
                aria-label="Close menu"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            {nav}
            <div className="mt-auto overflow-visible rounded-[20px] bg-[#0E8B65] p-5 pl-[85px] text-white relative shadow-[0_4px_20px_rgba(0,0,0,0.15)] min-h-[60px] flex items-center">
              <img
                src="/indoor_plant.png"
                alt="Decorative Plant"
                className="absolute -bottom-4 -left-6 w-[150px] h-[180px] object-cover object-bottom drop-shadow-[0_8px_12px_rgba(0,0,0,0.25)] mix-blend-normal pointer-events-none"
              />
              <div className="relative z-10 w-full">
                <button className="flex w-full items-center justify-between text-[13px] font-semibold text-white transition-opacity hover:opacity-80">
                  Visit Help Center
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M3.33331 8H12.6666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 3.33337L12.6667 8.00004L8 12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      <div className="flex flex-col flex-1 min-w-0 relative">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-[#FAFAFA]/95 px-4 py-3 backdrop-blur-sm lg:hidden">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open navigation menu"
            className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="7" x2="21" y2="7"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="17" x2="21" y2="17"/>
            </svg>
          </button>
          <span className="font-display text-base font-bold tracking-tight text-elms-ink">ELMS</span>
          <div className="flex items-center gap-3">
            {/* Bell */}
            <div className="relative" ref={mobileNotifRef}>
              <button
                className="relative text-slate-400 hover:text-slate-600 transition"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-[16px] w-[16px] items-center justify-center rounded-full bg-[#1769F0] text-[9px] font-bold text-white">
                    {notificationCount}
                  </span>
                )}
              </button>
              {isNotifOpen && (
                <div className="absolute right-0 mt-3 w-72 rounded-2xl border border-slate-200 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-50 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/50">
                    <h3 className="font-bold text-elms-ink text-[14px]">Notifications</h3>
                    {notificationCount > 0 && !isManager && (
                      <button
                        className="text-[12px] font-semibold text-elms-primary"
                        onClick={() => {
                          api.post("/leaves/notifications/ack", { ids: notifications.map(n => n.id) })
                            .then(() => { setNotificationCount(0); setNotifications([]); });
                        }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-[260px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      <div className="flex flex-col divide-y divide-slate-50">
                        {notifications.map((notif, idx) => (
                          <div key={idx} className="px-4 py-3 hover:bg-slate-50 flex gap-3 items-start">
                            <div className={`mt-0.5 flex-shrink-0 grid h-7 w-7 place-items-center rounded-full ${notif.status === 'approved' ? 'bg-green-100 text-green-600' : notif.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                              <Icon name={isManager ? "requests" : "history"} className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] text-elms-ink font-medium leading-snug">
                                {isManager ? `Pending: ${notif.reason}` : `Leave for ${notif.reason} was ${notif.status}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="px-4 py-6 text-center text-[13px] text-slate-400">No new notifications</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Avatar */}
            <div className="relative" ref={mobileProfileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="grid h-9 w-9 place-items-center rounded-full bg-[#E7F2EC] text-sm font-bold uppercase text-elms-primary"
              >
                {user?.username?.slice(0, 2) || "U"}
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-lg z-50">
                  <p className="px-3 py-2 text-[12px] font-semibold text-slate-500 capitalize">{user?.role}</p>
                  <button
                    onClick={() => logout()}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-slate-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Desktop-only floating header (unchanged) */}
        <header className={`absolute top-0 inset-x-0 mx-auto w-full ${contentWidth} px-8 pt-8 hidden lg:flex items-center justify-end gap-6 z-30 pointer-events-none`}>
          <div className="pointer-events-auto flex items-center gap-6">
            <div className="relative" ref={desktopNotifRef}>
              <button
                className="relative text-slate-400 hover:text-slate-600 transition"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#1769F0] text-[10px] font-bold text-white border-2 border-[#FAFAFA]">
                    {notificationCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-slate-200 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-50 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/50">
                    <h3 className="font-bold text-elms-ink text-[14px]">Notifications</h3>
                    {notificationCount > 0 && !isManager && (
                      <button
                        className="text-[12px] font-semibold text-elms-primary hover:text-blue-700"
                        onClick={() => {
                           api.post("/leaves/notifications/ack", { ids: notifications.map(n => n.id) })
                             .then(() => {
                               setNotificationCount(0);
                               setNotifications([]);
                             });
                        }}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      <div className="flex flex-col divide-y divide-slate-50">
                        {notifications.map((notif, idx) => (
                          <div key={idx} className="px-4 py-3 hover:bg-slate-50 transition flex gap-3 items-start">
                            <div className={`mt-0.5 flex-shrink-0 grid h-8 w-8 place-items-center rounded-full ${notif.status === 'approved' ? 'bg-green-100 text-green-600' : notif.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                              <Icon name={isManager ? "requests" : "history"} className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] text-elms-ink font-medium leading-tight mb-1">
                                {isManager ? `Pending request from ${notif.employee_username.split('@')[0]} for ${notif.reason}` : `Your leave for ${notif.reason} was ${notif.status}`}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {new Date(notif.created_at || notif.startDate || Date.now()).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-8 text-center">
                        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-slate-50 text-slate-300">
                          <Icon name="dashboard" className="h-6 w-6" />
                        </div>
                        <p className="text-[13px] font-medium text-slate-500">No new notifications</p>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-slate-100 p-2 bg-slate-50">
                    <Link
                      to={isManager ? "/manager/requests" : "/history"}
                      onClick={() => setIsNotifOpen(false)}
                      className="block w-full text-center py-2 text-[13px] font-bold text-slate-600 hover:text-elms-ink transition rounded-lg hover:bg-slate-200/50"
                    >
                      View all activity
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <div className="relative" ref={desktopProfileRef}>
              <div
                className="flex items-center gap-3 border-l border-slate-200 pl-6 cursor-pointer"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#E7F2EC] text-sm font-bold uppercase text-elms-primary">
                  {user?.username?.slice(0, 2) || "U"}
                </span>
                <div className="hidden text-left sm:block">
                  <p className="text-[14px] font-bold leading-tight text-elms-ink">{user?.username || "User"}</p>
                  <p className="text-[12px] font-medium text-slate-400 capitalize">{user?.role || "Employee"}</p>
                </div>
                <svg className="h-4 w-4 text-slate-400 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg z-50">
                  <button
                    onClick={() => logout()}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-slate-50 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className={`mx-auto w-full ${contentWidth} px-4 sm:px-8 pt-5 sm:pt-24 pb-10`}>{children}</main>
      </div>
    </div>
  );
}
