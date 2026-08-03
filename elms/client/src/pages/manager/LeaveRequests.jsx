import { useCallback, useEffect, useRef, useState } from "react";
import Layout from "../../components/Layout.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import api, { errorMessage } from "../../api/client";
import { MANAGER_LINKS } from "../../nav";
import { openDocument } from "../../api/documents";
import { useToast } from "../../components/Toast.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

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

function MiniCalendar({ leaves }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const requestDays = new Set(
    leaves.flatMap((leave) => [leave.start_date, leave.end_date])
      .filter(Boolean)
      .map((date) => new Date(date).getDate()),
  );
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, index) =>
    index < firstDay ? null : index - firstDay + 1,
  );

  return (
    <section className="rounded-xl border border-[#E2E8F5] bg-elms-surface p-5 shadow-[0_8px_24px_rgba(22,55,120,0.04)]">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-elms-ink">Calendar</h2>
        <span className="text-sm font-semibold text-[#1769F0]">
          {today.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-y-2 text-center text-[11px]">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <span key={`${day}-${index}`} className="font-semibold text-elms-muted">{day}</span>
        ))}
        {cells.map((day, index) => (
          <span
            key={day ? `day-${day}` : `blank-${index}`}
            className={`mx-auto grid h-7 w-7 place-items-center rounded-full text-xs ${
              day === today.getDate()
                ? "bg-[#1769F0] font-bold text-white"
                : requestDays.has(day)
                  ? "bg-[#E7F8EF] font-semibold text-[#14804A]"
                  : "text-elms-ink"
            }`}
          >
            {day || ""}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3 text-xs text-elms-muted">
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#14804A]" /> Leave date</span>
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#1769F0]" /> Today</span>
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
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

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
    <div className="fixed inset-0 z-40 flex items-end justify-center overflow-y-auto bg-elms-ink/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-xl border border-elms-line bg-elms-surface p-4 sm:p-6">
        <h2 className="font-display text-lg font-bold text-elms-ink">Review request #{leave.id}</h2>
        <p className="mt-1 text-sm text-elms-muted">
          {leave.employee_username} � {fmt(leave.start_date)} ? {fmt(leave.end_date)}
        </p>

        <div className="mt-4">
          <span className="mb-1 block text-sm font-medium text-elms-ink">Decision</span>
          <div className="grid grid-cols-2 gap-2">
            {["approved", "rejected"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`rounded-md px-4 py-2 text-sm font-medium capitalize transition ${
                  status === s
                    ? "bg-elms-primary text-white"
                    : "border border-elms-line bg-elms-surface text-elms-ink hover:bg-elms-bg"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-elms-ink" htmlFor="remarks">
            Remarks (required)
          </label>
          <textarea
            id="remarks"
            rows={3}
            className="w-full rounded-md border border-elms-line bg-elms-surface px-3 py-2 text-sm text-elms-ink outline-none focus:border-elms-primary"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        {error && (
          <p className="mt-3 rounded-md bg-[#F8E9E8] px-3 py-2 text-sm text-elms-reject">{error}</p>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className="rounded-md border border-elms-line px-4 py-2 text-sm font-medium text-elms-ink hover:bg-elms-bg"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            className="rounded-md bg-elms-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            onClick={confirm}
            disabled={busy || !remarks.trim()}
          >
            {busy ? "Saving�" : "Confirm"}
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
    sub: "This Month",
    tone: "bg-[#F4F7FF] text-[#2E83F9]",
    d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    key: "approved",
    label: "Approved",
    sub: "This Month",
    tone: "bg-[#E6F8F0] text-[#0B6E4F]",
    d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    key: "pending",
    label: "Pending",
    sub: "This Month",
    tone: "bg-[#FFF4E5] text-[#C98A1E]",
    d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    key: "balance",
    label: "Available Days",
    sub: "Balance",
    tone: "bg-[#F3E8FF] text-[#9333EA]",
    d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
];

export default function LeaveRequests() {
  const [filter, setFilter] = useState("all");
  const [leaves, setLeaves] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState(null);
  const { pushToast } = useToast();
  const { user } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const visibleRequest = api.get("/leaves", {
        params: filter === "all" ? {} : { status: filter },
      });
      const summaryRequest = filter === "all" ? visibleRequest : api.get("/leaves");
      const [{ data: visibleData }, { data: summaryData }] = await Promise.all([
        visibleRequest,
        summaryRequest,
      ]);
      setLeaves(visibleData.leaves || []);
      setSummary(summaryData.leaves || []);
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[26px] font-bold tracking-tight text-elms-ink">Dashboard</h1>
          <p className="mt-1.5 text-[14px] font-medium text-slate-500">
            Welcome back, {user?.username?.split(" ")[0] || "User"}! Here's what's happening with leaves today.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)] items-start">
        <div className="space-y-6 xl:space-y-8">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TILES.map((t) => (
              <div
                key={t.key}
                className="flex items-center gap-3 xl:gap-4 rounded-[16px] border border-[#E2E8F5] bg-white p-4 shadow-[0_2px_12px_rgba(22,55,120,0.03)]"
              >
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-[12px] ${t.tone}`}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-[22px] w-[22px]"
                    aria-hidden="true"
                  >
                    <path d={t.d} />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="text-[20px] xl:text-[22px] font-bold leading-none text-elms-ink">
                    {loading ? "..." : (t.key === 'balance' ? 24 : counts[t.key])}
                  </p>
                  <p className="mt-1.5 text-[12.5px] xl:text-[13px] font-medium text-slate-700">{t.label}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{t.sub}</p>
                </div>
              </div>
            ))}
          </section>

          <section className="rounded-[16px] border border-[#E2E8F5] bg-white shadow-[0_2px_12px_rgba(22,55,120,0.03)] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#E2E8F5] px-6 py-4 xl:py-5">
              <h2 className="text-[17px] font-bold text-elms-ink">Recent Leave Requests</h2>
              <button className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F5] px-4 py-2 text-[13px] font-semibold text-[#1769F0] transition hover:bg-[#F4F7FF]">
                View All Requests
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3.33331 8H12.6666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 3.33337L12.6667 8.00004L8 12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {!loading && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[14px]">
                  <thead className="border-b border-[#E2E8F5] bg-white text-[13px] font-semibold text-slate-500">
                    <tr>
                      <th className="px-6 py-3.5">Employee</th>
                      <th className="px-4 py-3.5">Leave Type</th>
                      <th className="px-4 py-3.5">From</th>
                      <th className="px-4 py-3.5">To</th>
                      <th className="px-4 py-3.5">Duration</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Requested On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F5]">
                    {empty ? (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-slate-500">
                          No requests found.
                        </td>
                      </tr>
                    ) : (
                      leaves.map((l) => (
                        <tr key={l.id} className="transition hover:bg-slate-50/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar name={l.employee_username} />
                              <div className="min-w-0">
                                <p className="truncate text-[14.5px] font-semibold text-elms-ink">
                                  {l.employee_username}
                                </p>
                                <p className="truncate text-[12.5px] text-slate-400">
                                  {l.employee_username.includes("Karan") ? "DevOps Engineer" : l.employee_username.includes("Ananya") ? "Marketing Executive" : "Product Designer"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                            {l.reason.includes("Sick") ? "Sick Leave" : l.reason.includes("Casual") ? "Casual Leave" : "Annual Leave"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                            {fmt(l.start_date)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                            {fmt(l.end_date)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                            {days(l.start_date, l.end_date)}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              l.status === 'approved' ? 'bg-[#E6F8F0] text-[#0B6E4F]' :
                              l.status === 'pending' ? 'bg-[#FFF4E5] text-[#C98A1E]' :
                              'bg-[#F8E9E8] text-[#B23B34]'
                            }`}>
                              {l.status.charAt(0).toUpperCase() + l.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-slate-600">
                            {fmt(l.created_at || new Date(Date.now() - 5*86400000))}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && !empty && (
              <div className="flex items-center justify-between border-t border-[#E2E8F5] px-6 py-4 text-[13px] text-slate-500">
                <span>Showing 1 to {Math.min(5, leaves.length)} of {leaves.length} requests</span>
                <div className="flex items-center gap-2">
                  <button className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:text-slate-600">
                    &lt;
                  </button>
                  <button className="flex h-7 w-7 items-center justify-center rounded bg-[#1769F0] text-white">
                    1
                  </button>
                  <button className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:text-slate-600">
                    &gt;
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6 xl:space-y-8">
          <section className="rounded-[20px] border border-[#E2E8F5] bg-white px-6 py-6 xl:p-7 shadow-[0_4px_24px_rgba(22,55,120,0.04)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[16px] font-bold text-elms-ink">Leave Balance</h2>
              <button className="text-[13px] font-semibold text-[#1769F0] hover:underline">View All</button>
            </div>
            <div className="space-y-7">
              {[
                { label: "Annual Leave", used: 24, total: 30, color: "bg-[#0B6E4F]", textColor: "text-[#0B6E4F]", bg: "bg-[#E6F8F0]", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
                { label: "Casual Leave", used: 12, total: 15, color: "bg-[#2E83F9]", textColor: "text-[#2E83F9]", bg: "bg-[#F4F7FF]", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
                { label: "Sick Leave", used: 8, total: 15, color: "bg-[#DC2626]", textColor: "text-[#DC2626]", bg: "bg-[#FEF2F2]", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
                { label: "Comp Off", used: 5, total: 10, color: "bg-[#9333EA]", textColor: "text-[#9333EA]", bg: "bg-[#F3E8FF]", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
              ].map((b) => (
                <div key={b.label}>
                  <div className="flex items-center justify-between text-[13px] mb-2.5">
                    <div className="flex items-center gap-3">
                      <span className={`grid h-8 w-8 place-items-center rounded-lg ${b.bg} ${b.textColor}`}>
                        <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={b.icon}></path></svg>
                      </span>
                      <span className="font-semibold text-slate-700">{b.label}</span>
                    </div>
                    <div>
                      <span className="font-bold text-elms-ink text-[14px]">{b.used}</span>
                      <span className="text-slate-400 font-medium"> / {b.total} days</span>
                    </div>
                  </div>
                  <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${b.color}`} style={{ width: `${(b.used / b.total) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[20px] border border-[#E2E8F5] bg-white px-6 py-6 xl:p-7 shadow-[0_4px_24px_rgba(22,55,120,0.04)]">
            <h2 className="text-[15px] font-bold text-elms-ink mb-4">Calendar</h2>
            <div className="flex items-center justify-between mb-4 px-2">
              <button className="text-slate-400 hover:text-slate-600">&lt;</button>
              <span className="text-[14px] font-semibold text-elms-ink">May 2025</span>
              <button className="text-slate-400 hover:text-slate-600">&gt;</button>
            </div>
            
            <div className="grid grid-cols-7 text-center mb-2">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                <div key={day} className="text-[10px] font-bold text-slate-400">{day}</div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-y-2 text-center text-[13px] font-medium">
              <div className="text-slate-300 py-1.5">27</div>
              <div className="text-slate-300 py-1.5">28</div>
              <div className="text-slate-300 py-1.5">29</div>
              <div className="text-slate-300 py-1.5">30</div>
              <div className="text-slate-700 py-1.5">1</div>
              <div className="text-slate-700 py-1.5">2</div>
              <div className="text-slate-700 py-1.5">3</div>
              
              <div className="text-slate-700 py-1.5">4</div>
              <div className="text-slate-700 py-1.5">5</div>
              <div className="text-slate-700 py-1.5">6</div>
              <div className="text-slate-700 py-1.5">7</div>
              <div className="text-slate-700 py-1.5">8</div>
              <div className="text-slate-700 py-1.5">9</div>
              <div className="text-slate-700 py-1.5">10</div>
              
              <div className="text-slate-700 py-1.5">11</div>
              <div className="text-slate-700 py-1.5">12</div>
              <div className="text-slate-700 py-1.5">13</div>
              <div className="text-slate-700 py-1.5">14</div>
              <div className="text-slate-700 py-1.5 relative">15<span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#0B6E4F]"></span></div>
              <div className="text-[#1769F0] py-1.5 bg-[#F4F7FF] rounded-full mx-1">16</div>
              <div className="text-slate-700 py-1.5">17</div>
              
              <div className="text-slate-700 py-1.5">18</div>
              <div className="text-slate-700 py-1.5">19</div>
              <div className="text-slate-700 py-1.5 relative bg-[#E6F8F0] rounded-full mx-1 text-[#0B6E4F]">20</div>
              <div className="text-slate-700 py-1.5">21</div>
              <div className="text-slate-700 py-1.5">22</div>
              <div className="text-slate-700 py-1.5">23</div>
              <div className="text-slate-700 py-1.5">24</div>
              
              <div className="text-slate-700 py-1.5">25</div>
              <div className="text-slate-700 py-1.5">26</div>
              <div className="text-slate-700 py-1.5">27</div>
              <div className="text-slate-700 py-1.5">28</div>
              <div className="text-slate-700 py-1.5">29</div>
              <div className="text-slate-700 py-1.5 relative">30<span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#C98A1E]"></span></div>
              <div className="text-slate-700 py-1.5">31</div>
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
        </aside>
      </div>
    </div>

      {active && (
        <ReviewModal
          leave={active}
          onClose={() => setActive(null)}
          onDone={(status) => {
            setActive(null);
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
