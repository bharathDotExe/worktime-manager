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

  return (
    <Layout links={MANAGER_LINKS}>
      <h1 className="text-2xl font-bold">Employees</h1>

      {error && <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <div className="card mt-6 overflow-x-auto p-0">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading employees…</p>
        ) : employees.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No employee accounts yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
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
                <tr key={e.id}>
                  <td className="px-4 py-3 text-slate-400">{e.id}</td>
                  <td className="px-4 py-3 font-medium">{e.username}</td>
                  <td className="px-4 py-3">{new Date(e.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{e.total_requests}</td>
                  <td className="px-4 py-3">{e.pending_requests}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
