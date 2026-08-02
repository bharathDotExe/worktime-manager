import { useEffect, useState } from "react";
import Layout from "../../components/Layout.jsx";
import api, { errorMessage } from "../../api/client";
import { MANAGER_LINKS } from "../../nav";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/employees")
      .then(({ data }) => setEmployees(data.employees || []))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const empty = !loading && employees.length === 0;

  return (
    <Layout links={MANAGER_LINKS}>
      <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
      <p className="mt-1 text-sm text-elms-muted">
        {loading ? "Loading…" : `${employees.length} account${employees.length === 1 ? "" : "s"}`}
      </p>

      {error && (
        <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}

      {loading && <p className="card mt-6 text-sm text-elms-muted">Loading employees…</p>}
      {empty && <p className="card mt-6 text-sm text-elms-muted">No employee accounts yet.</p>}

      {/* Mobile cards */}
      {!loading && !empty && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:hidden">
          {employees.map((e) => (
            <article key={e.id} className="card p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-50 text-sm font-bold uppercase text-accent-700">
                  {e.username.slice(0, 2)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-elms-ink">{e.username}</p>
                  <p className="text-xs text-elms-muted">
                    Joined {new Date(e.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-2 text-xs">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                  {e.total_requests} requests
                </span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
                  {e.pending_requests} pending
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Desktop table */}
      {!loading && !empty && (
        <div className="card mt-6 hidden overflow-x-auto p-0 md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-elms-muted">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Requests</th>
                <th className="px-4 py-3">Pending</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 text-slate-400">{e.id}</td>
                  <td className="px-4 py-3 font-medium">{e.username}</td>
                  <td className="px-4 py-3">{new Date(e.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{e.total_requests}</td>
                  <td className="px-4 py-3">{e.pending_requests}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
