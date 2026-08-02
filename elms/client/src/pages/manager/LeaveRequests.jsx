import { useCallback, useEffect, useRef, useState } from "react";
import Layout from "../../components/Layout.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import api, { errorMessage } from "../../api/client";
import { MANAGER_LINKS } from "../../nav";
import { openDocument } from "../../api/documents";
import { useToast } from "../../components/Toast.jsx";

const FILTERS = ["all", "pending", "approved", "rejected"];

function fmt(d) {
  return d
    ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "—";
}

function days(a, b) {
  if (!a || !b) return "—";
  const n = Math.round((new Date(b) - new Date(a)) / 86400000) + 1;
  return `${n} day${n === 1 ? "" : "s"}`;
}

function Avatar({ name = "" }) {
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
          {leave.employee_username} · {fmt(leave.start_date)} → {fmt(leave.end_date)}
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
            {busy ? "Saving…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

const TILES = [
  {
    key: "total",
    label: "Total requests",
    sub: "In this view",
    tone: "bg-[#E7F2EC] text-elms-primary",
    d: "M9 3h6l4 4v14H5V3h4zm0 8h6M9 15h6",
  },
  {
    key: "approved",
    label: "Approved",
    sub: "In this view",
    tone: "bg-[#E7F2EC] text-elms-primary",
    d: "M20 6L9 17l-5-5",
  },
  {
    key: "pending",
    label: "Pending",
    sub: "Awaiting review",
    tone: "bg-[#FBF3E2] text-elms-pending",
    d: "M12 7v5l3 2M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9z",
  },
  {
    key: "rejected",
    label: "Rejected",
    sub: "In this view",
    tone: "bg-[#F8E9E8] text-elms-reject",
    d: "M18 6L6 18M6 6l12 12",
  },
];

export default function LeaveRequests() {
  const [filter, setFilter] = useState("pending");
  const [leaves, setLeaves] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState(null);
  const { pushToast } = useToast();

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

  const bars = [
    { key: "approved", label: "Approved", color: "bg-elms-primary" },
    { key: "pending", label: "Pending", color: "bg-elms-pending" },
    { key: "rejected", label: "Rejected", color: "bg-elms-reject" },
  ];

  return (
    <Layout links={MANAGER_LINKS}>
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-bold tracking-tight text-elms-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-elms-muted">
          Review, approve or reject the team&apos;s leave applications.
        </p>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {/* Stat tiles */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {TILES.map((t) => (
              <div
                key={t.key}
                className="flex items-center gap-3 rounded-xl border border-elms-line bg-elms-surface p-4"
              >
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${t.tone}`}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path d={t.d} />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="font-display text-2xl font-bold leading-none text-elms-ink">
                    {loading ? "…" : counts[t.key]}
                  </p>
                  <p className="mt-1 truncate text-sm font-medium text-elms-ink">{t.label}</p>
                  <p className="truncate text-xs text-elms-muted">{t.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Requests panel */}
          <section className="mt-6 rounded-xl border border-elms-line bg-elms-surface">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-elms-line px-4 py-4 sm:px-5">
              <h2 className="font-display text-base font-bold text-elms-ink">
                Recent leave requests
              </h2>
              <div className="flex gap-1 overflow-x-auto">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition ${
                      filter === f
                        ? "bg-elms-primary text-white"
                        : "border border-elms-line bg-elms-surface text-elms-muted hover:bg-elms-bg"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="m-4 rounded-md bg-[#F8E9E8] px-3 py-2 text-sm text-elms-reject">
                {error}
              </p>
            )}
            {loading && <p className="px-5 py-8 text-sm text-elms-muted">Loading requests…</p>}
            {empty && <p className="px-5 py-8 text-sm text-elms-muted">No requests match this filter.</p>}

            {/* Mobile cards */}
            {!loading && !empty && (
              <div className="divide-y divide-elms-line lg:hidden">
                {leaves.map((l) => (
                  <article key={l.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar name={l.employee_username} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="truncate text-sm font-semibold text-elms-ink">
                            {l.employee_username}
                          </p>
                          <StatusBadge status={l.status} />
                        </div>
                        <p className="mt-0.5 text-xs text-elms-muted">
                          {fmt(l.start_date)} → {fmt(l.end_date)} ·{" "}
                          {days(l.start_date, l.end_date)}
                        </p>
                        <p className="mt-2 text-sm text-elms-ink">{l.reason}</p>
                        {l.manager_remarks && (
                          <p className="mt-2 rounded-md bg-elms-bg px-3 py-2 text-xs text-elms-muted">
                            <span className="font-semibold">Remarks:</span> {l.manager_remarks}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          {l.has_document && (
                            <button
                              onClick={() => openDocument(l.id)}
                              className="text-sm font-medium text-elms-primary hover:underline"
                            >
                              Open document
                            </button>
                          )}
                          {l.status === "pending" && (
                            <button
                              className="ml-auto rounded-md bg-elms-primary px-3 py-1.5 text-sm font-medium text-white"
                              onClick={() => setActive(l)}
                            >
                              Review
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Desktop table */}
            {!loading && !empty && (
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-elms-line text-xs uppercase tracking-wide text-elms-muted">
                    <tr>
                      <th className="px-5 py-3 font-medium">Employee</th>
                      <th className="px-4 py-3 font-medium">From</th>
                      <th className="px-4 py-3 font-medium">To</th>
                      <th className="px-4 py-3 font-medium">Duration</th>
                      <th className="px-4 py-3 font-medium">Doc</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-elms-line">
                    {leaves.map((l) => (
                      <tr key={l.id} className="hover:bg-elms-bg/60">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={l.employee_username} />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-elms-ink">
                                {l.employee_username}
                              </p>
                              <p className="max-w-[220px] truncate text-xs text-elms-muted">
                                {l.reason}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-elms-muted">
                          {fmt(l.start_date)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-elms-muted">
                          {fmt(l.end_date)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-elms-muted">
                          {days(l.start_date, l.end_date)}
                        </td>
                        <td className="px-4 py-3">
                          {l.has_document ? (
                            <button
                              onClick={() => openDocument(l.id)}
                              className="font-medium text-elms-primary hover:underline"
                            >
                              Open
                            </button>
                          ) : (
                            <span className="text-elms-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={l.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          {l.status === "pending" && (
                            <button
                              className="rounded-md bg-elms-primary px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
                              onClick={() => setActive(l)}
                            >
                              Review
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && !empty && (
              <div className="border-t border-elms-line px-5 py-3 text-xs text-elms-muted">
                Showing {leaves.length} request{leaves.length === 1 ? "" : "s"} · filter: {filter}
              </div>
            )}
          </section>
        </div>

        {/* Right rail */}
        <aside className="space-y-6">
          <section className="rounded-xl border border-elms-line bg-elms-surface p-5">
            <h2 className="font-display text-base font-bold text-elms-ink">Status breakdown</h2>
            <div className="mt-4 space-y-4">
              {bars.map((b) => {
                const value = counts[b.key];
                const pct = counts.total ? Math.round((value / counts.total) * 100) : 0;
                return (
                  <div key={b.key}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-elms-ink">{b.label}</span>
                      <span className="font-mono text-xs text-elms-muted">
                        {loading ? "…" : `${value} / ${counts.total}`}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-elms-bg">
                      <div
                        className={`h-1.5 rounded-full ${b.color} transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-elms-line bg-elms-surface p-5">
            <h2 className="font-display text-base font-bold text-elms-ink">Awaiting you</h2>
            <p className="mt-3 font-display text-4xl font-bold leading-none text-elms-ink">
              {loading ? "…" : counts.pending}
            </p>
            <p className="mt-1 text-sm text-elms-muted">
              pending request{counts.pending === 1 ? "" : "s"} in this view
            </p>
            <button
              onClick={() => setFilter("pending")}
              className="mt-4 w-full rounded-md border border-elms-line px-3 py-2 text-sm font-medium text-elms-ink hover:bg-elms-bg"
            >
              Show pending only
            </button>
          </section>

          <section className="rounded-xl border border-elms-line bg-elms-surface p-5">
            <h2 className="font-display text-base font-bold text-elms-ink">Review policy</h2>
            <ul className="mt-3 space-y-2 text-sm text-elms-muted">
              <li>Every decision requires written remarks.</li>
              <li>Decisions are final and audit-logged.</li>
              <li>Only managers can approve or reject.</li>
            </ul>
          </section>
        </aside>
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
