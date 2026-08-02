import { useEffect, useState } from "react";
import Layout from "../../components/Layout.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import api, { errorMessage } from "../../api/client";
import { EMPLOYEE_LINKS } from "../../nav";
import { openDocument } from "../../api/documents";

function fmt(date) {
  return date ? new Date(date).toLocaleDateString() : "—";
}

export default function LeaveHistory() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/leaves/mine")
      // Server already orders newest-first; sort defensively.
      .then(({ data }) =>
        setLeaves(
          [...(data.leaves || [])].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at),
          ),
        ),
      )
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const empty = !loading && leaves.length === 0;

  return (
    <Layout links={EMPLOYEE_LINKS}>
      <h1 className="text-2xl font-bold tracking-tight">Leave history</h1>
      <p className="mt-1 text-sm text-slate-500">Every request you have filed, newest first.</p>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}

      {loading && <p className="card mt-6 text-sm text-slate-500">Loading requests…</p>}
      {empty && <p className="card mt-6 text-sm text-slate-500">No leave requests yet.</p>}

      {/* Mobile: stacked cards */}
      {!loading && !empty && (
        <div className="mt-6 space-y-3 md:hidden">
          {leaves.map((l) => (
            <article key={l.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-slate-800">
                  {fmt(l.start_date)} → {fmt(l.end_date)}
                </p>
                <StatusBadge status={l.status} />
              </div>
              <p className="mt-2 text-sm text-slate-600">{l.reason}</p>
              {l.manager_remarks && (
                <p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <span className="font-semibold">Remarks:</span> {l.manager_remarks}
                </p>
              )}
              {l.has_document && (
                <button
                  onClick={() => openDocument(l.id)}
                  className="mt-3 text-sm font-medium text-accent-600 hover:underline"
                >
                  {l.document_name || "View document"}
                </button>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Desktop: table */}
      {!loading && !empty && (
        <div className="card mt-6 hidden overflow-x-auto p-0 md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Remarks</th>
                <th className="px-4 py-3">Document</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaves.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/70">
                  <td className="whitespace-nowrap px-4 py-3">
                    {fmt(l.start_date)} → {fmt(l.end_date)}
                  </td>
                  <td className="max-w-xs px-4 py-3">{l.reason}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={l.status} />
                  </td>
                  <td className="max-w-xs px-4 py-3 text-slate-600">
                    {l.manager_remarks || <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {l.has_document ? (
                      <button
                        onClick={() => openDocument(l.id)}
                        className="font-medium text-accent-600 hover:underline"
                      >
                        {l.document_name || "View"}
                      </button>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
