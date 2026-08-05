import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import api, { errorMessage } from "../../api/client";
import { EMPLOYEE_LINKS } from "../../nav";

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

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/leaves/mine")
      .then(({ data }) => {
        const leaves = data.leaves || [];
        setStats({
          total: leaves.length,
          pending: leaves.filter((l) => l.status === "pending").length,
          approved: leaves.filter((l) => l.status === "approved").length,
          rejected: leaves.filter((l) => l.status === "rejected").length,
        });
        setRecent(leaves.slice(0, 5));
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

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

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {CARDS.map((c) => (
          <div key={c.key} className="card hover-lift p-4 sm:p-5">
            {/* Mobile: stacked. Desktop: horizontal */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${c.tone}`}>
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
                  <path d={c.d} />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="text-2xl font-bold leading-none text-slate-900">
                  {loading ? "…" : (stats?.[c.key] ?? 0)}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700 leading-tight">{c.label}</p>
                <p className="text-xs text-slate-400">{c.sub}</p>
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
                  <li key={l.id} className="flex items-start justify-between gap-3 px-4 py-3">
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
                      <tr key={l.id} className="hover:bg-slate-50/70">
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
    </Layout>
  );
}
