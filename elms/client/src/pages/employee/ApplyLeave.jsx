import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout.jsx";
import api, { errorMessage } from "../../api/client";
import { EMPLOYEE_LINKS } from "../../nav";
import { useToast } from "../../components/Toast.jsx";

const ALLOWED = ["application/pdf", "image/png", "image/jpeg"];
const MAX_MB = 5;

export default function ApplyLeave() {
  const [form, setForm] = useState({ reason: "", start_date: "", end_date: "" });
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { pushToast } = useToast();

  // Client-side checks are convenience only — the server re-validates all of it.
  function validate() {
    if (form.reason.trim().length < 5) return "Reason must be at least 5 characters";
    if (!form.start_date || !form.end_date) return "Both dates are required";
    if (form.end_date < form.start_date) return "End date must be on or after start date";
    if (file) {
      if (!ALLOWED.includes(file.type)) return "Only PDF, PNG or JPEG files are allowed";
      if (file.size > MAX_MB * 1024 * 1024) return `File must be smaller than ${MAX_MB}MB`;
    }
    return "";
  }

  async function onSubmit(e) {
    e.preventDefault();
    const problem = validate();
    setError(problem);
    if (problem) return;

    setBusy(true);
    try {
      const body = new FormData();
      body.append("reason", form.reason.trim());
      body.append("start_date", form.start_date);
      body.append("end_date", form.end_date);
      if (file) body.append("document", file);

      await api.post("/leaves", body);
      pushToast("Leave request submitted", "success");
      navigate("/history");
    } catch (err) {
      setError(errorMessage(err, "Could not submit the request"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout links={EMPLOYEE_LINKS}>
      <h1 className="text-2xl font-bold">Apply for leave</h1>

      <form onSubmit={onSubmit} className="card mt-6 max-w-2xl space-y-4">
        <div>
          <label className="label" htmlFor="reason">Reason</label>
          <textarea
            id="reason"
            rows={4}
            className="input"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="start">Start date</label>
            <input
              id="start"
              type="date"
              className="input"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="end">End date</label>
            <input
              id="end"
              type="date"
              className="input"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="document">Supporting document (PDF, PNG, JPEG — max {MAX_MB}MB)</label>
          <input
            id="document"
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            className="input"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        {error && <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Submitting…" : "Submit request"}
          </button>
          <button type="button" className="btn-ghost" onClick={() => navigate("/dashboard")}>
            Cancel
          </button>
        </div>
      </form>
    </Layout>
  );
}
