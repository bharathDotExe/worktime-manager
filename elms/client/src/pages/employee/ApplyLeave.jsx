import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout.jsx";
import api, { errorMessage } from "../../api/client";
import { EMPLOYEE_LINKS } from "../../nav";
import { useToast } from "../../components/Toast.jsx";
import { cacheInvalidate } from "../../api/cache";

const ALLOWED = ["application/pdf", "image/png", "image/jpeg"];
const MAX_MB = 5;

function FileIcon({ type }) {
  if (type === "application/pdf")
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-rose-500" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>
        <line x1="9" y1="9" x2="11" y2="9"/>
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  );
}

export default function ApplyLeave() {
  const [form, setForm] = useState({ reason: "", start_date: "", end_date: "" });
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const fileInputRef = useRef(null);

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

  function handleFile(f) {
    if (!f) return;
    setFile(f);
    setError("");
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
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
      cacheInvalidate("leaves_*");
      pushToast("Leave request submitted", "success");
      navigate("/history");
    } catch (err) {
      setError(errorMessage(err, "Could not submit the request"));
    } finally {
      setBusy(false);
    }
  }

  const charCount = form.reason.length;
  const leaveDays =
    form.start_date && form.end_date
      ? Math.max(
          0,
          Math.round(
            (new Date(form.end_date) - new Date(form.start_date)) / 86400000
          ) + 1
        )
      : null;

  return (
    <Layout links={EMPLOYEE_LINKS}>
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#E7F2EC]">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#0B6E4F]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Apply for leave</h1>
            <p className="text-sm text-slate-500">Fill in the details below to submit a leave request</p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="max-w-2xl space-y-5">

        {/* Reason card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label htmlFor="reason" className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-slate-400 mb-3">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Reason for leave
          </label>
          <textarea
            id="reason"
            rows={4}
            placeholder="Describe why you're requesting leave (e.g. medical appointment, family event, vacation…)"
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#0B6E4F] focus:bg-white focus:ring-2 focus:ring-[#E7F2EC]"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            required
          />
          <div className="mt-2 flex items-center justify-between">
            <p className={`text-xs ${charCount < 5 ? "text-rose-400" : "text-slate-400"}`}>
              {charCount < 5 ? `${5 - charCount} more characters needed` : "Looks good ✓"}
            </p>
            <p className="text-xs text-slate-400">{charCount} chars</p>
          </div>
        </div>

        {/* Date range card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-slate-400 mb-3">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Leave duration
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="start" className="mb-1.5 block text-xs font-medium text-slate-500">Start date</label>
              <input
                id="start"
                type="date"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#0B6E4F] focus:bg-white focus:ring-2 focus:ring-[#E7F2EC]"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="end" className="mb-1.5 block text-xs font-medium text-slate-500">End date</label>
              <input
                id="end"
                type="date"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#0B6E4F] focus:bg-white focus:ring-2 focus:ring-[#E7F2EC]"
                value={form.end_date}
                min={form.start_date || undefined}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                required
              />
            </div>
          </div>
          {leaveDays !== null && leaveDays > 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#E7F2EC] px-4 py-2.5">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#0B6E4F]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <p className="text-sm font-semibold text-[#0B6E4F]">
                {leaveDays} {leaveDays === 1 ? "day" : "days"} selected
              </p>
            </div>
          )}
        </div>

        {/* Document upload card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-slate-400 mb-3">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Supporting document
            <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 normal-case tracking-normal">Optional</span>
          </p>

          {!file ? (
            <div
              className={`group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 transition-all ${
                dragOver
                  ? "border-[#0B6E4F] bg-[#E7F2EC]"
                  : "border-slate-200 bg-slate-50 hover:border-[#0B6E4F] hover:bg-[#E7F2EC]/40"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              <div className={`grid h-12 w-12 place-items-center rounded-2xl transition ${dragOver ? "bg-[#0B6E4F] text-white" : "bg-slate-200 text-slate-500 group-hover:bg-[#0B6E4F] group-hover:text-white"}`}>
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700">
                  {dragOver ? "Drop it here!" : "Drop file here or click to browse"}
                </p>
                <p className="mt-1 text-xs text-slate-400">PDF, PNG or JPEG — max {MAX_MB}MB</p>
              </div>
              <input
                ref={fileInputRef}
                id="document"
                type="file"
                accept="application/pdf,image/png,image/jpeg"
                className="sr-only"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
              />
            </div>
          ) : (
            <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <FileIcon type={file.type} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">{file.name}</p>
                <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition"
                aria-label="Remove file"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p role="alert" className="text-sm text-rose-700">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0B6E4F] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
                Submitting…
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                Submit request
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </Layout>
  );
}
