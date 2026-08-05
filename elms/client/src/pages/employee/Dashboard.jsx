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
    label: "Total requests",
    sub: "All time",
    tone: "bg-accent-50 text-accent-600",
    d: "M9 3h6l4 4v14H5V3h4zm0 8h6M9 15h6",
  },
  {
    key: "approved",
    label: "Approved",
    sub: "All time",
    tone: "bg-emerald-50 text-emerald-600",
    d: "M20 6L9 17l-5-5",
  },
  {
    key: "pending",
    label: "Pending",
    sub: "Awaiting review",
    tone: "bg-amber-50 text-amber-600",
    d: "M12 7v5l3 2M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9z",
  },
  {
    key: "rejected",
    label: "Rejected",
    sub: "All time",
    tone: "bg-rose-50 text-rose-600",
    d: "M18 6L6 18M6 6l12 12",
  },
];

function fmt(d) {
  return d ? new Date(d).toLocaleDateString() : "—";
}

function LeaveDetailModal({ leave, onClose }) {
  const [docUrl, setDocUrl] = useState(null);
  const [docType, setDocType] = useState(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState("");

  useEffect(() => {
    if (!leave?.has_document) return;
    setDocLoading(true);
    fetchDocumentUrl(leave.id)
      .then(({ url, type }) => { setDocUrl(url); setDocType(type); })
      .catch(() => setDocError("Could not load document."))
      .finally(() => setDocLoading(false));
    return () => { if (docUrl) URL.revokeObjectURL(docUrl); };
  }, [leave?.id]);

  // Close on Escape key
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-[0_24px_60px_rgba(0,0,0,0.18)] overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/60">
          <div>
            <h2 className="text-base font-bold text-slate-900">Leave Request Details</h2>
            <p className="text-xs text-slate-400 mt-0.5">Submitted {fmt(leave.created_at)}</p>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 transition"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Status pill */}
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusColor}`}>
            {leave.status}
          </span>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">From</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{fmt(leave.start_date)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">To</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{fmt(leave.end_date)}</p>
            </div>
          </div>

          {/* Reason */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Reason</p>
            <p className="text-sm text-slate-700 leading-relaxed">{leave.reason}</p>
          </div>

          {/* Manager remarks */}
          {leave.manager_remarks && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Manager Remarks</p>
              <p className="text-sm text-slate-700">{leave.manager_remarks}</p>
            </div>
          )}

          {/* Document preview */}
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
                  <img
                    src={docUrl}
                    alt={leave.document_name || "Attachment"}
                    className="w-full rounded-xl border border-slate-200 object-contain max-h-64"
                  />
                ) : docType === "application/pdf" ? (
                  <iframe
                    src={docUrl}
                    title={leave.document_name || "Document"}
                    className="w-full h-72 rounded-xl border border-slate-200"
                  />
                ) : (
                  <a
                    href={docUrl}
                    download={leave.document_name || "document"}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                    </svg>
                    {leave.document_name || "Download document"}
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

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const closeModal = useCallback(() => setSelectedLeave(null), []);

  useEffect(() => {
    // Try to hydrate instantly from cache
    const cached = cacheGet("leaves_mine");
    if (cached) {
      applyLeaves(cached);
      setLoading(false);
    }

    // Always fetch fresh data (but UI is already showing if cached)
    api
      .get("/leaves/mine")
      .then(({ data }) => {
        const leaves = data.leaves || [];
        cacheSet("leaves_mine", leaves, 60_000); // 60s TTL
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

  return (
    <Layout links={EMPLOYEE_LINKS}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Here&apos;s what&apos;s happening with your leaves today.
          </p>
        </div>
        <Link to="/apply" className="btn-primary shrink-0">
          Apply leave
        </Link>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {CARDS.map((c) => (
          <div key={c.key} className="card hover-lift p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className={`grid h-8 w-8 sm:h-11 sm:w-11 shrink-0 place-items-center rounded-lg sm:rounded-xl ${c.tone}`}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  aria-hidden="true"
                >
                  <path d={c.d} />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold leading-none text-slate-900">
                  {loading ? "…" : (stats?.[c.key] ?? 0)}
                </p>
                <p className="mt-0.5 text-[11px] sm:text-sm font-medium text-slate-700 leading-tight">{c.label}</p>
                <p className="text-[10px] sm:text-xs text-slate-400">{c.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className="card p-0">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-slate-900">Recent leave requests</h2>
            <Link
              to="/history"
              className="shrink-0 rounded-md bg-accent-50 px-3 py-1.5 text-xs font-semibold text-accent-700 hover:bg-accent-100"
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <p className="px-4 py-6 text-sm text-slate-500 sm:px-6">Loading…</p>
          ) : recent.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500 sm:px-6">No leave requests yet.</p>
          ) : (
            <>
              {/* Mobile list */}
              <ul className="divide-y divide-slate-100 md:hidden">
                {recent.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-start justify-between gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition"
                    onClick={() => setSelectedLeave(l)}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{l.reason}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {fmt(l.start_date)} → {fmt(l.end_date)}
                      </p>
                    </div>
                    <StatusBadge status={l.status} />
                  </li>
                ))}
              </ul>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
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
                        className="hover:bg-slate-50/70 cursor-pointer"
                        onClick={() => setSelectedLeave(l)}
                      >
                        <td className="max-w-xs truncate px-6 py-3 font-medium text-slate-800">
                          {l.reason}
                        </td>
                        <td className="whitespace-nowrap px-6 py-3">{fmt(l.start_date)}</td>
                        <td className="whitespace-nowrap px-6 py-3">{fmt(l.end_date)}</td>
                        <td className="px-6 py-3">
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

        <section className="card p-4 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900">Quick actions</h2>
          <div className="mt-4 flex flex-col gap-2">
            <Link to="/apply" className="btn-primary w-full">
              Apply for leave
            </Link>
            <Link to="/history" className="btn-ghost w-full">
              View history
            </Link>
          </div>
          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">Status breakdown</p>
            <div className="mt-3 space-y-2 text-sm">
              {["approved", "pending", "rejected"].map((k) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="capitalize text-slate-600">{k}</span>
                  <span className="font-semibold text-slate-900">
                    {loading ? "…" : (stats?.[k] ?? 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {selectedLeave && (
        <LeaveDetailModal leave={selectedLeave} onClose={closeModal} />
      )}
    </Layout>
  );
}
