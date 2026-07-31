import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout.jsx";
import api, { errorMessage } from "../../api/client";
import { EMPLOYEE_LINKS } from "../../nav";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
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
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout links={EMPLOYEE_LINKS}>
      <h1 className="text-2xl font-bold">Your leave overview</h1>
      <p className="mt-1 text-sm text-slate-500">Apply for leave and track its status.</p>

      {error && <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {["total", "pending", "approved", "rejected"].map((key) => (
          <div key={key} className="card">
            <p className="text-xs uppercase tracking-wide text-slate-500">{key}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading ? "…" : (stats?.[key] ?? 0)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/apply" className="btn-primary">Apply for leave</Link>
        <Link to="/history" className="btn-ghost">View history</Link>
      </div>
    </Layout>
  );
}
