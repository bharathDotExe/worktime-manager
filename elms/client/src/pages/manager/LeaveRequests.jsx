import { useCallback, useEffect, useState } from "react";
import Layout from "../../components/Layout.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import api, { errorMessage } from "../../api/client";
import { MANAGER_LINKS } from "../../nav";
import { openDocument } from "../../api/documents";
import { useToast } from "../../components/Toast.jsx";

const FILTERS = ["all", "pending", "approved", "rejected"];

function fmt(d) {
  return d ? new Date(d).toLocaleDateString() : "—";
}

function ReviewModal({ leave, onClose, onDone }) {
  const [status, setStatus] = useState("approved");
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
    <div className="fixed inset-0 z-40 flex items-end justify-center overflow-y-auto bg-slate-900/40 p-4 sm:items-center">
      <div className="card w-full max-w-md p-4 sm:p-6">
        <h2 className="text-lg font-semibold">Review request #{leave.id}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {leave.employee_username} · {fmt(leave.start_date)} → {fmt(leave.end_date)}
        </p>

        <div className="mt-4">
          <span className="label">Decision</span>
          <div className="grid grid-cols-2 gap-2">
            {["approved", "rejected"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={status === s ? "btn-primary capitalize" : "btn-ghost capitalize"}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="label" htmlFor="remarks">
            Remarks (required)
          </label>
          <textarea
            id="remarks"
            rows={3}
            className="input"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        {error && (
          <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button className="btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn-primary" onClick={confirm} disabled={busy || !remarks.trim()}>
            {busy ? "Saving…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LeaveRequests() {
  const [filter, setFilter] = useState("pending");
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState(null);
  const { pushToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/leaves", {
        params: filter === "all" ? {} : { status: filter },
      });
      setLeaves(data.leaves || []);
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

  return (
    <Layout links={MANAGER_LINKS}>
      <div className="min-w-0">
        <h1 className="text-xl font-bold sm:text-2xl">Leave requests</h1>
        <p className="mt-1 text-sm text-slate-500">
          {loading ? "Loading…" : `${leaves.length} ${filter === "all" ? "total" : filter}`}
        </p>
      </div>

      <div className="mt-4 -mx-4 flex gap-1 overflow-x-auto px-4 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition ${
              filter === f
                ? "bg-accent-500 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}

      {loading && <p className="card mt-6 text-sm text-slate-500">Loading requests…</p>}
      {empty && <p className="card mt-6 text-sm text-slate-500">No requests match this filter.</p>}

      {/* Mobile cards */}
      {!loading && !empty && (
        <div className="mt-6 space-y-3 lg:hidden">
          {leaves.map((l) => (
            <article key={l.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{l.employee_username}</p>
                  <p className="text-xs text-slate-500">
                    {fmt(l.start_date)} → {fmt(l.end_date)}
                  </p>
                </div>
                <StatusBadge status={l.status} />
              </div>
              <p className="mt-2 text-sm text-slate-600">{l.reason}</p>
              {l.manager_remarks && (
                <p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <span className="font-semibold">Remarks:</span> {l.manager_remarks}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {l.has_document && (
                  <button
                    onClick={() => openDocument(l.id)}
                    className="text-sm font-medium text-accent-600 hover:underline"
                  >
                    Open document
                  </button>
                )}
                {l.status === "pending" && (
                  <button className="btn-primary ml-auto" onClick={() => setActive(l)}>
                    Review
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Desktop table */}
      {!loading && !empty && (
        <div className="card mt-6 hidden overflow-x-auto p-0 lg:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Doc</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Remarks</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaves.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-medium">{l.employee_username}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {fmt(l.start_date)} → {fmt(l.end_date)}
                  </td>
                  <td className="max-w-xs px-4 py-3">{l.reason}</td>
                  <td className="px-4 py-3">
                    {l.has_document ? (
                      <button
                        onClick={() => openDocument(l.id)}
                        className="font-medium text-accent-600 hover:underline"
                      >
                        Open
                      </button>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={l.status} />
                  </td>
                  <td className="max-w-xs px-4 py-3 text-slate-600">
                    {l.manager_remarks || <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {l.status === "pending" && (
                      <button className="btn-primary" onClick={() => setActive(l)}>
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
