import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout.jsx";
import api, { errorMessage } from "../../api/client";
import { EMPLOYEE_LINKS } from "../../nav";

const CARDS = [
  { key: "total", label: "Total requests", tone: "bg-slate-100 text-slate-700" },
  { key: "pending", label: "Pending", tone: "bg-amber-100 text-amber-800" },
  { key: "approved", label: "Approved", tone: "bg-emerald-100 text-emerald-800" },
  { key: "rejected", label: "Rejected", tone: "bg-rose-100 text-rose-800" },
];

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
        setRecent(leaves.slice(0, 3));
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout links={EMPLOYEE_LINKS}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold sm:text-2xl">Your leave overview</h1>
          <p className="mt-1 text-sm text-slate-500">Apply for leave and track its status.</p>
        </div>
        <Link to="/apply" className="btn-primary shrink-0">
          Apply
        </Link>
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {CARDS.map((c) => (
          <div key={c.key} className="card hover-lift p-4 sm:p-6">
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${c.tone}`}
            >
              {c.label}
            </span>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {loading ? "…" : (stats?.[c.key] ?? 0)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="card p-4 sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Recent requests
          </h2>
          {loading ? (
            <p className="mt-4 text-sm text-slate-500">Loading…</p>
          ) : recent.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No leave requests yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {recent.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{l.reason}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(l.start_date).toLocaleDateString()} →{" "}
                      {new Date(l.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold capitalize text-slate-600">
                    {l.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/history" className="btn-ghost mt-4 inline-flex">
            View full history
          </Link>
        </section>

        <section className="card p-4 sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Quick actions
          </h2>
          <div className="mt-4 flex flex-col gap-2">
            <Link to="/apply" className="btn-primary w-full">
              Apply for leave
            </Link>
            <Link to="/history" className="btn-ghost w-full">
              View history
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
}
