import { useCallback, useEffect, useRef, useState } from "react";
import Layout from "../../components/Layout.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import api, { errorMessage } from "../../api/client";
import { MANAGER_LINKS } from "../../nav";
import { openDocument, fetchDocumentUrl } from "../../api/documents";
import { useToast } from "../../components/Toast.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { cacheGet, cacheSet, cacheInvalidate } from "../../api/cache";

const FILTERS = ["all", "pending", "approved", "rejected"];

function fmt(d) {
  return d
    ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "�";
}

function days(a, b) {
  if (!a || !b) return "�";
  const n = Math.round((new Date(b) - new Date(a)) / 86400000) + 1;
  return `${n} day${n === 1 ? "" : "s"}`;
}

function CalendarWidget({ leaves }) {
  const [date, setDate] = useState(new Date());

  const year = date.getFullYear();
  const month = date.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const prevMonthDays = new Date(year, month, 0).getDate();
  
  const days = [];
  
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, isCurrentMonth: false, monthOffset: -1 });
  }
  
  const today = new Date();
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, isCurrentMonth: true, monthOffset: 0 });
  }
  
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({ day: i, isCurrentMonth: false, monthOffset: 1 });
  }

  const leaveMap = {}; 
  
  leaves.forEach(leave => {
    if (!leave.start_date || !leave.end_date) return;
    
    let current = new Date(leave.start_date);
    const end = new Date(leave.end_date);
    current.setHours(0,0,0,0);
    end.setHours(0,0,0,0);
    
    while (current <= end) {
      const dateString = `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`;
      if (!leaveMap[dateString] || leave.status === 'pending') {
         leaveMap[dateString] = leave.status; 
      }
      current.setDate(current.getDate() + 1);
    }
  });

  const nextMonth = () => setDate(new Date(year, month + 1, 1));
  const prevMonth = () => setDate(new Date(year, month - 1, 1));

  return (
    <section className="rounded-[20px] border border-[#E2E8F5] bg-white px-6 py-6 xl:p-7 shadow-[0_4px_24px_rgba(22,55,120,0.04)]">
      <h2 className="text-[15px] font-bold text-elms-ink mb-4">Calendar</h2>
      <div className="flex items-center justify-between mb-4 px-2">
        <button onClick={prevMonth} className="text-slate-400 hover:text-slate-600 transition-colors">&lt;</button>
        <span className="text-[14px] font-semibold text-elms-ink">
          {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={nextMonth} className="text-slate-400 hover:text-slate-600 transition-colors">&gt;</button>
      </div>
      
      <div className="grid grid-cols-7 text-center mb-2">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
          <div key={day} className="text-[10px] font-bold text-slate-400">{day}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-y-2 text-center text-[13px] font-medium">
        {days.map((d, i) => {
          let cellDate = new Date(year, month + d.monthOffset, d.day);
          const isToday = cellDate.getDate() === today.getDate() && cellDate.getMonth() === today.getMonth() && cellDate.getFullYear() === today.getFullYear();
          const dateString = `${cellDate.getFullYear()}-${cellDate.getMonth()}-${cellDate.getDate()}`;
          const leaveStatus = leaveMap[dateString];
          
          let containerClass = "py-1.5 relative mx-1 ";
          let textClass = d.isCurrentMonth ? "text-slate-700" : "text-slate-300";
          
          if (isToday) {
            containerClass += "bg-[#F4F7FF] rounded-full ";
            textClass = "text-[#1769F0]";
          }
          
          return (
            <div key={i} className={`${containerClass} ${textClass}`}>
              {d.day}
              {leaveStatus === 'approved' && !isToday && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#0B6E4F]"></span>
              )}
              {leaveStatus === 'pending' && !isToday && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#C98A1E]"></span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4 mt-6 text-[11px] font-medium text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#0B6E4F]"></span> Approved
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#C98A1E]"></span> Pending
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#1769F0]"></span> Today
        </div>
      </div>
    </section>
  );
}

function Avatar({ name = "", avatarUrl = null }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className="h-9 w-9 rounded-full object-cover" />;
  }
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#E7F2EC] text-xs font-bold uppercase text-elms-primary">
      {name.slice(0, 2)}
    </span>
  );
}

function ReviewModal({ leave, onClose, onDone }) {
  const [status, setStatus] = useState("approved");
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [docPreview, setDocPreview] = useState(null);
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (leave.has_document) {
      let active = true;
      fetchDocumentUrl(leave.id).then(res => {
        if (active) setDocPreview(res);
      }).catch(err => console.error("Failed to fetch document preview", err));
      return () => { active = false; };
    }
  }, [leave.id, leave.has_document]);

  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    const focusable = dialogRef.current?.querySelectorAll("button:not([disabled]), textarea:not([disabled])");
    focusable?.[0]?.focus();
    function handleKeyDown(e) {
      if (e.key === "Escape" && !busy) onClose();
      if (e.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [busy, onClose]);

  async function confirm() {
    if (remarks.trim().length < 3) return setError("Remarks are required");
    setError("");
    setBusy(true);
    try {
      await api.patch(`/leaves/${leave.id}`, { status, manager_remarks: remarks.trim() });
      onDone(status);
    } catch (err) {
      setError(errorMessage(err, "Could not update the request"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div
        className={`relative z-10 w-full rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ease-out ${
          expanded ? "max-w-4xl max-h-[90vh]" : "max-w-md max-h-[85vh]"
        }`}
        ref={dialogRef}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <Avatar name={leave.employee_username} />
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">{leave.employee_username}</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Request #{leave.id} • {fmt(leave.start_date)} — {fmt(leave.end_date)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setExpanded(!expanded)}
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 transition"
              aria-label={expanded ? "Collapse" : "Expand"}
              title={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 14 10 14 10 20"/>
                  <polyline points="20 10 14 10 14 4"/>
                  <line x1="14" y1="10" x2="21" y2="3"/>
                  <line x1="3" y1="21" x2="10" y2="14"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 3 21 3 21 9"/>
                  <polyline points="9 21 3 21 3 15"/>
                  <line x1="21" y1="3" x2="14" y2="10"/>
                  <line x1="3" y1="21" x2="10" y2="14"/>
                </svg>
              )}
            </button>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 transition"
              disabled={busy}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
            <div className={`rounded-xl border border-slate-100 bg-slate-50 p-4 col-span-2`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Leave Type</p>
                  <p className="text-sm font-bold text-slate-800">
                    {leave.reason.toLowerCase().includes("sick") || leave.reason.toLowerCase().includes("unwell") 
                      ? "Sick Leave" 
                      : leave.reason.toLowerCase().includes("casual") || leave.reason.toLowerCase().includes("personal") 
                      ? "Casual Leave" 
                      : "Annual Leave"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Duration</p>
                  <p className="text-sm font-bold text-slate-800">{days(leave.start_date, leave.end_date)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Reason</p>
            <p className="text-sm text-slate-800 leading-relaxed">{leave.reason}</p>
          </div>

          {leave.has_document && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Supporting Document</p>
                <button
                  type="button"
                  onClick={() => openDocument(leave.id)}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-[#1769F0] hover:underline"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open Original
                </button>
              </div>
              {docPreview ? (
                docPreview.type.startsWith("image/") ? (
                  <img src={docPreview.url} alt="Attachment Preview" className="w-full max-h-48 object-contain rounded-lg border border-slate-200 bg-white" />
                ) : (
                  <iframe src={docPreview.url} className="w-full h-48 rounded-lg border border-slate-200 bg-white" title="Attachment Preview"></iframe>
                )
              ) : (
                <div className="w-full h-32 flex items-center justify-center rounded-lg border border-slate-200 border-dashed bg-slate-100">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                    </svg>
                    <span className="text-xs font-medium">Loading preview...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2 block">Decision</span>
            <div className={`grid gap-3 ${expanded ? "grid-cols-2 max-w-sm" : "grid-cols-2"}`}>
              {["approved", "rejected"].map((s) => {
                const isActive = status === s;
                const isApproved = s === "approved";
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`rounded-xl border px-4 py-3 text-sm font-bold capitalize transition-all duration-200 flex items-center justify-center gap-2 ${
                      isActive
                        ? isApproved
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20"
                          : "bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/20"
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {isApproved ? (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    )}
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Highly Recognizable Manager Remarks */}
          <div className="rounded-xl border-l-4 border-[#0B6E4F] bg-[#F0FBF6] p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#0B6E4F] text-white">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <label className="text-xs font-bold uppercase tracking-wide text-[#0B6E4F]" htmlFor="remarks">
                Manager Remarks (Required)
              </label>
            </div>
            <textarea
              id="remarks"
              rows={expanded ? 6 : 3}
              placeholder="Provide a reason or instructions..."
              className="w-full rounded-lg border border-[#0B6E4F]/20 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#0B6E4F] focus:ring-2 focus:ring-[#0B6E4F]/20 transition-all shadow-inner"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end shrink-0">
          <button
            className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
            onClick={confirm}
            disabled={busy || !remarks.trim()}
          >
            {busy ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
                Saving...
              </>
            ) : "Confirm Decision"}
          </button>
        </div>
      </div>
    </div>
  );
}

const TILES = [
  {
    key: "total",
    label: "Total Requests",
    sub: "This month",
    tone: "bg-[#F4F7FF]",
    img: "/total_requests_icon.png",
    isPending: false,
  },
  {
    key: "approved",
    label: "Approved",
    sub: "This month",
    tone: "bg-[#E6F8F0]",
    img: "/approved_icon.png",
    isPending: false,
  },
  {
    key: "pending",
    label: "Pending Review",
    sub: "Requires action",
    tone: "bg-[#FFF4E5]",
    img: "/pending_icon.png",
    isPending: true,
  },
  {
    key: "rejected",
    label: "Rejected",
    sub: "This month",
    tone: "bg-[#F8E9E8]",
    img: "/rejected_icon.png",
    isPending: false,
    imgClass: "scale-[1.1]",
  },
];

/* Derive leave type from the reason string */
function leaveTypeFromReason(reason = "") {
  const r = reason.toLowerCase();
  // New format: "Annual Leave — some detail"
  if (reason.includes(" — ")) return reason.split(" — ")[0].trim();
  // Legacy keyword matching
  if (r.includes("annual")) return "Annual Leave";
  if (r.includes("sick") || r.includes("unwell") || r.includes("medical")) return "Sick Leave";
  if (r.includes("casual") || r.includes("personal") || r.includes("errand")) return "Casual Leave";
  if (r.includes("family") || r.includes("emergency") || r.includes("bereavement")) return "Family Emergency";
  if (r.includes("maternity") || r.includes("paternity") || r.includes("parental")) return "Maternity / Paternity";
  return "Leave Request";
}

/* Skeleton row */
function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-slate-100 shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3 w-28 rounded bg-slate-100" />
            <div className="h-2.5 w-20 rounded bg-slate-100" />
          </div>
        </div>
      </td>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-3 w-16 rounded bg-slate-100" />
        </td>
      ))}
    </tr>
  );
}

/* Proper empty state */
function EmptyState({ filter }) {
  return (
    <tr>
      <td colSpan="7">
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-slate-100">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18M8 14h4M8 18h2" />
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-slate-800">
            {filter === "all" ? "No leave requests yet" : `No ${filter} requests`}
          </p>
          <p className="mt-1.5 max-w-[280px] text-sm text-slate-500 leading-relaxed">
            {filter === "all"
              ? "Leave requests from your employees will appear here once they are submitted."
              : `There are currently no requests with a "${filter}" status.`}
          </p>
        </div>
      </td>
    </tr>
  );
}

export default function LeaveRequests() {
  const [filter, setFilter] = useState("all");
  const [leaves, setLeaves] = useState([]);
  const [summary, setSummary] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState(null);
  const { pushToast } = useToast();
  const { user } = useAuth();

  const load = useCallback(async () => {
    setError("");

    // Hydrate from cache instantly (skip the loading spinner)
    const cacheKey = `mgr_leaves_${filter}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      setLeaves(cached.leaves);
      setSummary(cached.summary);
      setBalances(cached.balances);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const visibleRequest = api.get("/leaves", {
        params: filter === "all" ? {} : { status: filter },
      });
      const summaryRequest = filter === "all" ? visibleRequest : api.get("/leaves");
      const balancesRequest = api.get("/leaves/balances");
      
      const [{ data: visibleData }, { data: summaryData }, { data: balancesData }] = await Promise.all([
        visibleRequest,
        summaryRequest,
        balancesRequest,
      ]);
      const result = {
        leaves: visibleData.leaves || [],
        summary: summaryData.leaves || [],
        balances: balancesData.balances || [],
      };
      cacheSet(cacheKey, result, 30_000); // 30s TTL for manager data
      setLeaves(result.leaves);
      setSummary(result.summary);
      setBalances(result.balances);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const empty = !loading && leaves.length === 0;

  const counts = {
    total: summary.length,
    approved: summary.filter((l) => l.status === "approved").length,
    pending: summary.filter((l) => l.status === "pending").length,
    rejected: summary.filter((l) => l.status === "rejected").length,
  };

  return (
    <Layout links={MANAGER_LINKS}>
    <div className="pb-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-[26px] font-bold tracking-tight text-elms-ink">Manager Dashboard</h1>
          <p className="mt-1.5 text-[14px] font-medium text-slate-500">
            Welcome back, <span className="font-semibold text-slate-700">{user?.username?.split(" ")[0] || "Manager"}</span>. Here is an overview of your team&apos;s leave activity.
          </p>
        </div>
        {counts.pending > 0 && (
          <div className="shrink-0 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[13px] font-semibold text-amber-700">
              {counts.pending} pending {counts.pending === 1 ? "request" : "requests"} need review
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6 xl:gap-8 items-stretch">
        <div className="space-y-6 xl:space-y-8">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TILES.map((t) => (
              <div
                key={t.key}
                className="group flex items-center gap-3 xl:gap-4 rounded-[16px] border border-[#E2E8F5] bg-white p-4 shadow-[0_2px_12px_rgba(22,55,120,0.03)] hover:shadow-[0_4px_20px_rgba(22,55,120,0.07)] transition-shadow"
              >
                <span className={`grid h-[64px] w-[64px] shrink-0 place-items-center rounded-[16px] ${t.tone} transition-transform duration-200 group-hover:scale-105`}>
                  <img
                    src={t.img}
                    alt={t.label}
                    className={`h-full w-full object-contain ${t.imgClass || 'scale-[1.7]'}`}
                    aria-hidden="true"
                  />
                </span>
                <div className="min-w-0">
                  {loading ? (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-6 w-10 rounded bg-slate-100" />
                      <div className="h-3 w-20 rounded bg-slate-100" />
                      <div className="h-2.5 w-16 rounded bg-slate-100" />
                    </div>
                  ) : (
                    <>
                      <p className="text-[24px] xl:text-[26px] font-extrabold leading-none text-elms-ink tabular-nums">
                        {counts[t.key] ?? 0}
                      </p>
                      <p className="mt-1.5 text-[12.5px] xl:text-[13px] font-semibold text-slate-700">{t.label}</p>
                      {t.isPending ? (
                        <span className="mt-0.5 inline-block rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
                          Requires Action
                        </span>
                      ) : (
                        <p className="mt-0.5 text-[11px] text-slate-400">{t.sub}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </section>

          <section className="rounded-[16px] border border-[#E2E8F5] bg-white shadow-[0_2px_12px_rgba(22,55,120,0.03)] overflow-hidden">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F5] px-6 py-4 xl:py-5">
              <div className="flex items-center gap-3">
                <h2 className="text-[17px] font-bold text-elms-ink">Recent Employee Leave Requests</h2>
                {!loading && leaves.length > 0 && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
                    {leaves.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Filter tabs */}
                <div className="flex items-center gap-1 rounded-lg border border-[#E2E8F5] bg-slate-50 p-1">
                  {FILTERS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`rounded-md px-3 py-1 text-[12px] font-semibold capitalize transition-colors ${
                        filter === f
                          ? "bg-white text-elms-ink shadow-sm border border-[#E2E8F5]"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                      {f === "pending" && counts.pending > 0 && (
                        <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
                          {counts.pending}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-[14px]">
                <thead className="border-b border-[#E2E8F5] bg-slate-50/60 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3.5 whitespace-nowrap">Employee</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Leave Type</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">From</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">To</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Duration</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Status</th>
                    <th className="px-6 py-3.5 text-right whitespace-nowrap">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F5]">
                  {loading ? (
                    [1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)
                  ) : empty ? (
                    <EmptyState filter={filter} />
                  ) : (
                    leaves.map((l) => (
                      <tr
                        key={l.id}
                        className="cursor-pointer transition-colors hover:bg-[#F8FAFB] active:bg-slate-100 group"
                        onClick={() => setActive(l)}
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && setActive(l)}
                        role="button"
                        aria-label={`Review leave request from ${l.employee_username}`}
                      >
                        {/* Employee */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={l.employee_username} />
                            <div className="min-w-0 max-w-[160px]">
                              <p className="truncate text-[14px] font-bold text-elms-ink" title={l.employee_username}>
                                {l.employee_username}
                              </p>
                              <p className="truncate text-[12px] font-medium text-slate-500">
                                {l.employee_email || "Employee"}
                              </p>
                            </div>
                          </div>
                        </td>
                        {/* Leave Type */}
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[12px] font-medium text-slate-700 whitespace-nowrap">
                            {leaveTypeFromReason(l.reason)}
                          </span>
                        </td>
                        {/* Dates */}
                        <td className="whitespace-nowrap px-4 py-4 text-[13px] text-slate-600">{fmt(l.start_date)}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-[13px] text-slate-600">{fmt(l.end_date)}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-[13px] font-medium text-slate-700">{days(l.start_date, l.end_date)}</td>
                        {/* Status */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${
                            l.status === "approved" ? "bg-[#E6F8F0] text-[#0B6E4F]" :
                            l.status === "pending"  ? "bg-[#FFF4E5] text-[#C98A1E]" :
                            "bg-[#F8E9E8] text-[#B23B34]"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              l.status === "approved" ? "bg-[#0B6E4F]" :
                              l.status === "pending"  ? "bg-[#C98A1E]" :
                              "bg-[#B23B34]"
                            }`} />
                            {l.status.charAt(0).toUpperCase() + l.status.slice(1)}
                          </span>
                        </td>
                        {/* Submitted + Review hint */}
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <span className="text-[13px] text-slate-500">{fmt(l.created_at)}</span>
                          {l.status === "pending" && (
                            <span className="ml-3 hidden group-hover:inline-flex items-center gap-1 text-[11px] font-semibold text-[#1769F0]">
                              Review
                              <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                                <path d="M3.33331 8H12.6666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M8 3.33337L12.6667 8.00004L8 12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!loading && !empty && (
              <div className="flex items-center justify-between border-t border-[#E2E8F5] px-6 py-3.5 text-[12px] text-slate-500 bg-slate-50/40">
                <span className="font-medium">
                  Showing <span className="font-bold text-slate-700">{leaves.length}</span> {leaves.length === 1 ? "request" : "requests"}
                  {filter !== "all" && <> with status <span className="font-bold text-slate-700 capitalize">{filter}</span></>}
                </span>
                <div className="flex items-center gap-1.5">
                  <button className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors" aria-label="Previous page">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <button className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1769F0] text-[12px] font-bold text-white">
                    1
                  </button>
                  <button className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors" aria-label="Next page">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>

      {active && (
        <ReviewModal
          leave={active}
          onClose={() => setActive(null)}
          onDone={(status) => {
            setActive(null);
            cacheInvalidate("mgr_*");
            pushToast(
              `Request #${active.id} ${status}`,
              status === "approved" ? "success" : "error",
            );
            load();
          }}
        />
      )}
    </Layout>
  );
}
