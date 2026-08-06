import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import api, { errorMessage } from "../../api/client";
import { EMPLOYEE_LINKS } from "../../nav";
import { fetchDocumentUrl } from "../../api/documents";
import { cacheGet, cacheSet } from "../../api/cache";

const CARDS = [
  {
    key: "total",
    label: "Total Requests",
    sub: "All time",
    tone: "bg-[#F4F7FF]",
    img: "/total_requests_icon.png",
  },
  {
    key: "approved",
    label: "Approved",
    sub: "All time",
    tone: "bg-[#E6F8F0]",
    img: "/approved_icon.png",
  },
  {
    key: "pending",
    label: "Pending",
    sub: "Awaiting review",
    tone: "bg-[#FFF4E5]",
    img: "/pending_icon.png",
  },
  {
    key: "rejected",
    label: "Rejected",
    sub: "All time",
    tone: "bg-[#F8E9E8]",
    img: "/rejected_icon.png",
    imgClass: "scale-[0.8]",
  },
];

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CardSkeleton() {
  return (
    <div className="card p-3 sm:p-5 animate-pulse">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="h-[52px] w-[52px] sm:h-[64px] sm:w-[64px] shrink-0 rounded-lg sm:rounded-[16px] bg-slate-100" />
        <div className="space-y-2 flex-1">
          <div className="h-6 w-12 rounded bg-slate-100" />
          <div className="h-3 w-20 rounded bg-slate-100" />
          <div className="h-3 w-14 rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-slate-100">
        <svg viewBox="0 0 24 24" className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18M8 14h4M8 18h2" />
        </svg>
      </div>
      <p className="text-[15px] font-semibold text-slate-800">No leave requests yet</p>
      <p className="mt-1.5 max-w-[260px] text-sm text-slate-500 leading-relaxed">
        Submit your first leave request and track its status right here.
      </p>
      <Link
        to="/apply"
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#0B6E4F] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0a6347] focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]/40 transition-colors"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Apply for Leave
      </Link>
    </div>
  );
}

function LeaveDetailModal({ leave, onClose }) {
  const [docUrl, setDocUrl] = useState(null);
  const [docType, setDocType] = useState(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState("");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!leave?.has_document) return;
    setDocLoading(true);
    fetchDocumentUrl(leave.id)
      .then(({ url, type }) => { setDocUrl(url); setDocType(type); })
      .catch(() => setDocError("Could not load document."))
      .finally(() => setDocLoading(false));
    return () => { if (docUrl) URL.revokeObjectURL(docUrl); };
  }, [leave?.id]);

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!leave) return null;

  const statusColor = {
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-50 text-rose-700 border-rose-200",
    pending:  "bg-amber-50 text-amber-700 border-amber-200",
  }[leave.status] || "bg-slate-50 text-slate-700 border-slate-200";

  const durationDays = leave.start_date && leave.end_date
    ? Math.max(1, Math.round((new Date(leave.end_date) - new Date(leave.start_date)) / 86400000) + 1)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
      <div
        className={`relative z-10 w-full rounded-2xl bg-white shadow-[0_24px_60px_rgba(0,0,0,0.18)] overflow-hidden flex flex-col transition-all duration-300 ease-out ${
          expanded ? "max-w-5xl max-h-[95vh]" : "max-w-lg max-h-[90vh]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/60 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900">Leave Request Details</h2>
            <p className="text-xs text-slate-400 mt-0.5">Submitted {fmt(leave.created_at)}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setExpanded(!expanded)}
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 transition"
              aria-label={expanded ? "Collapse" : "Expand"}
              title={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>
                  <line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
                  <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
                </svg>
              )}
            </button>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 transition"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusColor}`}>
              {leave.status}
            </span>
            {durationDays && (
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                {durationDays} {durationDays === 1 ? "day" : "days"}
              </span>
            )}
          </div>

          <div className={`grid gap-3 ${expanded ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2"}`}>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">From</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{fmt(leave.start_date)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">To</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{fmt(leave.end_date)}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Reason</p>
            <p className="text-sm text-slate-700 leading-relaxed">{leave.reason}</p>
          </div>

          {leave.manager_remarks && (
            <div className="rounded-xl border-l-4 border-[#0B6E4F] bg-[#F0FBF6] px-5 py-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#0B6E4F] text-white">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <p className="text-[12px] font-bold uppercase tracking-wide text-[#0B6E4F]">Manager Remarks</p>
              </div>
              <p className="text-sm font-medium text-slate-800 leading-relaxed pl-9">{leave.manager_remarks}</p>
            </div>
          )}

          {leave.has_document && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Attached Document</p>
              {docLoading && (
                <div className="flex items-center justify-center h-40 rounded-xl bg-slate-50 border border-slate-200">
                  <svg className="h-6 w-6 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                  </svg>
                </div>
              )}
              {docError && <p className="text-xs text-rose-600 mt-1">{docError}</p>}
              {docUrl && !docLoading && (
                docType?.startsWith("image/") ? (
                  <img src={docUrl} alt={leave.document_name || "Attachment"} className={`w-full rounded-xl border border-slate-200 object-contain ${expanded ? "max-h-[60vh]" : "max-h-64"}`} />
                ) : docType === "application/pdf" ? (
                  <iframe src={docUrl} title={leave.document_name || "Document"} className={`w-full rounded-xl border border-slate-200 ${expanded ? "h-[60vh]" : "h-72"}`} />
                ) : (
                  <a href={docUrl} download={leave.document_name || "document"} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                    </svg>
                    {leave.document_name || "Download Document"}
                  </a>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BreakdownBar({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className="text-xs font-bold text-slate-800">{value}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const closeModal = useCallback(() => setSelectedLeave(null), []);

  useEffect(() => {
    const cached = cacheGet("leaves_mine");
    if (cached) {
      applyLeaves(cached);
      setLoading(false);
    }
    api
      .get("/leaves/mine")
      .then(({ data }) => {
        const leaves = data.leaves || [];
        cacheSet("leaves_mine", leaves, 60_000);
        applyLeaves(leaves);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  function applyLeaves(leaves) {
    setStats({
      total: leaves.length,
      pending: leaves.filter((l) => l.status === "pending").length,
      approved: leaves.filter((l) => l.status === "approved").length,
      rejected: leaves.filter((l) => l.status === "rejected").length,
    });
    setRecent(leaves.slice(0, 5));
  }

  const hasRequests = !loading && recent.length > 0;

  return (
    <Layout links={EMPLOYEE_LINKS}>
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 sm:items-center">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            A summary of all your leave requests and their current status.
          </p>
        </div>
        <Link
          to="/apply"
          className="btn-primary shrink-0 focus:ring-2 focus:ring-[#0B6E4F]/40 focus:outline-none"
        >
          Apply Leave
        </Link>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {loading
          ? CARDS.map((c) => <CardSkeleton key={c.key} />)
          : CARDS.map((c) => (
              <div key={c.key} className="card hover-lift p-3 sm:p-5 group">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className={`grid h-[52px] w-[52px] sm:h-[64px] sm:w-[64px] shrink-0 place-items-center rounded-lg sm:rounded-[16px] ${c.tone} transition-transform duration-200 group-hover:scale-105`}>
                    <img src={c.img} alt={c.label} className={`h-full w-full object-contain ${c.imgClass || 'scale-[1.7]'}`} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-2xl sm:text-3xl font-extrabold leading-none text-slate-900 tabular-nums">
                      {stats?.[c.key] ?? 0}
                    </p>
                    <p className="mt-1 text-[11px] sm:text-sm font-semibold text-slate-700 leading-tight">
                      {c.label}
                    </p>
                    {c.key === "pending" ? (
                      <span className="mt-0.5 inline-block rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
                        Awaiting Review
                      </span>
                    ) : (
                      <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">{c.sub}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Main content grid */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">

        {/* Recent Requests */}
        <section className="card p-0">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">Recent Leave Requests</h2>
              {hasRequests && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
                  {recent.length}
                </span>
              )}
            </div>
            {hasRequests && (
              <Link
                to="/history"
                className="shrink-0 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-colors"
              >
                View All →
              </Link>
            )}
          </div>

          {loading ? (
            <div className="divide-y divide-slate-50">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between px-6 py-4 animate-pulse">
                  <div className="space-y-2 flex-1">
                    <div className="h-3.5 w-48 rounded bg-slate-100" />
                    <div className="h-3 w-32 rounded bg-slate-100" />
                  </div>
                  <div className="h-5 w-16 rounded-full bg-slate-100 ml-4" />
                </div>
              ))}
            </div>
          ) : recent.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Mobile list */}
              <ul className="divide-y divide-slate-100 md:hidden">
                {recent.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors"
                    onClick={() => setSelectedLeave(l)}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedLeave(l)}
                    role="button"
                    aria-label={`View details for ${l.reason}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800" title={l.reason}>
                        {l.reason}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {fmt(l.start_date)} – {fmt(l.end_date)}
                      </p>
                    </div>
                    <StatusBadge status={l.status} />
                  </li>
                ))}
              </ul>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-3">Reason</th>
                      <th className="px-6 py-3">From</th>
                      <th className="px-6 py-3">To</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recent.map((l) => (
                      <tr
                        key={l.id}
                        className="cursor-pointer transition-colors hover:bg-slate-50 active:bg-slate-100"
                        onClick={() => setSelectedLeave(l)}
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && setSelectedLeave(l)}
                        role="button"
                        aria-label={`View details for ${l.reason}`}
                      >
                        <td className="px-6 py-3.5 font-medium text-slate-800">
                          <span className="block max-w-[260px] truncate" title={l.reason}>
                            {l.reason}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-3.5 text-slate-600">{fmt(l.start_date)}</td>
                        <td className="whitespace-nowrap px-6 py-3.5 text-slate-600">{fmt(l.end_date)}</td>
                        <td className="px-6 py-3.5">
                          <StatusBadge status={l.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        {/* Side panel */}
        <aside className="flex flex-col gap-5">

          {/* Quick Actions */}
          <section className="card p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Quick Actions</h2>
            <div className="flex flex-col gap-2">
              <Link to="/apply" className="btn-primary w-full text-center focus:ring-2 focus:ring-[#0B6E4F]/40 focus:outline-none">
                Apply for Leave
              </Link>
              <Link to="/history" className="btn-ghost w-full text-center focus:ring-2 focus:ring-slate-300 focus:outline-none">
                View History
              </Link>
            </div>

            {/* Status Breakdown with animated bars */}
            {!loading && stats && stats.total > 0 && (
              <div className="mt-5 rounded-xl bg-slate-50 p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status Breakdown</p>
                <BreakdownBar label="Approved" value={stats.approved} total={stats.total} color="bg-emerald-500" />
                <BreakdownBar label="Pending"  value={stats.pending}  total={stats.total} color="bg-amber-400" />
                <BreakdownBar label="Rejected" value={stats.rejected} total={stats.total} color="bg-rose-400" />
              </div>
            )}
          </section>

          {/* Leave Guide card */}
          <section className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#E6F8F0] text-[#0B6E4F]">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-slate-900">Leave Guide</h2>
            </div>
            <ul className="space-y-2.5">
              {[
                "Submit requests at least 2 days in advance.",
                "Attach a medical certificate for sick leave.",
                "You will be notified once your manager decides.",
              ].map((text) => (
                <li key={text} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                  <svg viewBox="0 0 16 16" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0B6E4F]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 8.5l3 3L13 5"/>
                  </svg>
                  {text}
                </li>
              ))}
            </ul>
          </section>

        </aside>
      </div>

      {selectedLeave && (
        <LeaveDetailModal leave={selectedLeave} onClose={closeModal} />
      )}
    </Layout>
  );
}
