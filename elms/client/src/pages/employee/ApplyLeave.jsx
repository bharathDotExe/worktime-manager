import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout.jsx";
import api, { errorMessage } from "../../api/client";
import { EMPLOYEE_LINKS } from "../../nav";
import { useToast } from "../../components/Toast.jsx";
import { cacheInvalidate } from "../../api/cache";

const ALLOWED = ["application/pdf", "image/png", "image/jpeg"];
const MAX_MB = 5;

const LEAVE_TYPES = [
  {
    id: "annual",
    label: "Annual Leave",
    desc: "Planned vacation or personal time off",
    color: "bg-blue-50 border-blue-200 text-blue-700",
    activeColor: "bg-blue-600 border-blue-600 text-white",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
    ),
  },
  {
    id: "sick",
    label: "Sick Leave",
    desc: "Illness, medical appointment or recovery",
    color: "bg-rose-50 border-rose-200 text-rose-700",
    activeColor: "bg-rose-600 border-rose-600 text-white",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
  },
  {
    id: "casual",
    label: "Casual Leave",
    desc: "Short personal errands or urgent matters",
    color: "bg-amber-50 border-amber-200 text-amber-700",
    activeColor: "bg-amber-500 border-amber-500 text-white",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
      </svg>
    ),
  },
  {
    id: "family",
    label: "Family Emergency",
    desc: "Urgent family situation or bereavement",
    color: "bg-purple-50 border-purple-200 text-purple-700",
    activeColor: "bg-purple-600 border-purple-600 text-white",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    id: "maternity",
    label: "Maternity / Paternity",
    desc: "Parental leave for a new child",
    color: "bg-pink-50 border-pink-200 text-pink-700",
    activeColor: "bg-pink-600 border-pink-600 text-white",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a5 5 0 0 1 5 5v3a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5z"/><path d="M7 21h10"/><path d="M12 15v6"/>
      </svg>
    ),
  },
  {
    id: "other",
    label: "Other",
    desc: "Any other reason not listed above",
    color: "bg-slate-50 border-slate-200 text-slate-700",
    activeColor: "bg-slate-700 border-slate-700 text-white",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
      </svg>
    ),
  },
];

function FileIcon({ type }) {
  if (type === "application/pdf")
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>
        <line x1="9" y1="9" x2="11" y2="9"/>
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  );
}

function SectionLabel({ icon, title, required }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-slate-700">
        {icon}
        {title}
      </div>
      {required ? (
        <span className="rounded bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 uppercase tracking-wide">Required</span>
      ) : (
        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">Optional</span>
      )}
    </div>
  );
}

export default function ApplyLeave() {
  const [form, setForm] = useState({ reason: "", start_date: "", end_date: "" });
  const [leaveType, setLeaveType] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({ leaveType: false, reason: false, start_date: false, end_date: false, file: false });
  const [submitError, setSubmitError] = useState("");
  const [busy, setBusy] = useState(false);
  
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const fileInputRef = useRef(null);

  // Focus refs
  const reasonRef = useRef(null);
  const startRef = useRef(null);
  const endRef = useRef(null);
  const typeRef = useRef(null);

  function getErrors() {
    const errs = {};
    if (!leaveType) errs.leaveType = "Please select a leave type.";
    if (form.reason.trim().length < 5) errs.reason = "Please provide a reason (minimum 5 characters).";
    if (!form.start_date) errs.start_date = "Start date is required.";
    if (!form.end_date) errs.end_date = "End date is required.";
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      errs.end_date = "End date must be on or after start date.";
    }
    if (file) {
      if (!ALLOWED.includes(file.type)) errs.file = "Only PDF, PNG or JPEG files are allowed.";
      else if (file.size > MAX_MB * 1024 * 1024) errs.file = `File must be smaller than ${MAX_MB}MB.`;
    }
    return errs;
  }

  const currentErrors = getErrors();
  const isComplete = !currentErrors.leaveType && !currentErrors.reason && !currentErrors.start_date && !currentErrors.end_date && !currentErrors.file;

  function handleFile(f) {
    if (!f) return;
    setFile(f);
    setTouched({ ...touched, file: true });
    if (f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    
    // Mark all as touched on submit
    setTouched({ leaveType: true, reason: true, start_date: true, end_date: true, file: true });
    
    const errs = getErrors();
    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      if (errs.leaveType && typeRef.current) typeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      else if (errs.reason && reasonRef.current) reasonRef.current.focus();
      else if (errs.start_date && startRef.current) startRef.current.focus();
      else if (errs.end_date && endRef.current) endRef.current.focus();
      return;
    }

    const typeName = LEAVE_TYPES.find((t) => t.id === leaveType)?.label || "";
    const fullReason = typeName
      ? `${typeName} — ${form.reason.trim()}`
      : form.reason.trim();

    setBusy(true);
    try {
      const body = new FormData();
      body.append("reason", fullReason);
      body.append("start_date", form.start_date);
      body.append("end_date", form.end_date);
      if (file) body.append("document", file);

      await api.post("/leaves", body);
      cacheInvalidate("leaves_*");
      pushToast("Leave request submitted", "success");
      navigate("/history");
    } catch (err) {
      setSubmitError(errorMessage(err, "Could not submit the request"));
    } finally {
      setBusy(false);
    }
  }

  const charCount = form.reason.length;
  const leaveDays =
    form.start_date && form.end_date && form.end_date >= form.start_date
      ? Math.max(
          1,
          Math.round(
            (new Date(form.end_date) - new Date(form.start_date)) / 86400000
          ) + 1
        )
      : null;

  return (
    <Layout links={EMPLOYEE_LINKS}>
      <div className="max-w-3xl pb-12">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#E7F2EC]">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#0B6E4F]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Apply for Leave</h1>
              <p className="text-sm text-slate-500">Fill in the details below to submit a leave request</p>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">

          {/* Leave Type Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" ref={typeRef}>
            <SectionLabel 
              title="Leave Type" 
              required={true}
              icon={<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M4 6h16M4 10h16M4 14h10"/></svg>}
            />
            
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {LEAVE_TYPES.map((t) => {
                const isActive = leaveType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { setLeaveType(t.id); setTouched({ ...touched, leaveType: true }); }}
                    className={`relative flex flex-col items-start gap-3 rounded-xl border-2 p-4 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0B6E4F]/40 ${
                      isActive 
                        ? "border-[#0B6E4F] bg-[#F0FBF6] shadow-sm shadow-[#0B6E4F]/10" 
                        : "border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`grid h-8 w-8 place-items-center rounded-lg transition-colors ${isActive ? "bg-[#0B6E4F] text-white" : t.color}`}>
                      {t.icon}
                    </div>
                    <span className="min-w-0">
                      <span className={`block text-sm font-bold leading-tight ${isActive ? "text-[#0B6E4F]" : "text-slate-800"}`}>{t.label}</span>
                      <span className={`block text-xs mt-1 leading-snug ${isActive ? "text-[#0B6E4F]/80" : "text-slate-500"}`}>{t.desc}</span>
                    </span>
                    {isActive && (
                      <div className="absolute top-4 right-4 text-[#0B6E4F]">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {touched.leaveType && currentErrors.leaveType && (
              <p className="mt-3 text-[13px] font-semibold text-rose-600 flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                {currentErrors.leaveType}
              </p>
            )}
          </div>

          {/* Reason Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionLabel 
              title="Reason for leave" 
              required={true}
              icon={<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
            />
            
            <p className="text-[13px] text-slate-500 mb-3 leading-relaxed">
              Briefly explain the reason for your leave request. This helps your manager review your request.
            </p>
            
            <textarea
              id="reason"
              ref={reasonRef}
              rows={4}
              placeholder="e.g., I have a medical appointment scheduled for tomorrow morning..."
              className={`w-full resize-none rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all shadow-inner ${
                touched.reason && currentErrors.reason 
                  ? "border-rose-300 focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500/20" 
                  : "border-slate-200 focus:border-[#0B6E4F] focus:bg-white focus:ring-2 focus:ring-[#E7F2EC]"
              }`}
              value={form.reason}
              onChange={(e) => {
                setForm({ ...form, reason: e.target.value });
                setTouched({ ...touched, reason: true });
              }}
              onBlur={() => setTouched({ ...touched, reason: true })}
            />
            
            <div className="mt-2 flex items-center justify-between">
              <div>
                {touched.reason && currentErrors.reason ? (
                  <p className="text-[13px] font-semibold text-rose-600 flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                    {currentErrors.reason}
                  </p>
                ) : (
                  <p className="text-[13px] font-medium text-emerald-600 opacity-0 transition-opacity" style={{ opacity: charCount >= 5 ? 1 : 0 }}>
                    Looks good ✓
                  </p>
                )}
              </div>
              <p className={`text-[12px] font-semibold ${charCount >= 5 ? "text-slate-400" : "text-amber-500"}`}>
                {charCount} / 5 min chars
              </p>
            </div>
          </div>

          {/* Date range Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionLabel 
              title="Leave duration" 
              required={true}
              icon={<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
            />
            
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="start" className="mb-1.5 block text-[13px] font-bold text-slate-700">Start date</label>
                <input
                  id="start"
                  ref={startRef}
                  type="date"
                  className={`w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-all shadow-inner ${
                    touched.start_date && currentErrors.start_date 
                      ? "border-rose-300 focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500/20" 
                      : "border-slate-200 focus:border-[#0B6E4F] focus:bg-white focus:ring-2 focus:ring-[#E7F2EC]"
                  }`}
                  value={form.start_date}
                  onChange={(e) => {
                    setForm({ ...form, start_date: e.target.value });
                    setTouched({ ...touched, start_date: true });
                  }}
                  onBlur={() => setTouched({ ...touched, start_date: true })}
                />
                {touched.start_date && currentErrors.start_date && (
                  <p className="mt-2 text-[13px] font-semibold text-rose-600 flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                    {currentErrors.start_date}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="end" className="mb-1.5 block text-[13px] font-bold text-slate-700">End date</label>
                <input
                  id="end"
                  ref={endRef}
                  type="date"
                  className={`w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-all shadow-inner ${
                    touched.end_date && currentErrors.end_date 
                      ? "border-rose-300 focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500/20" 
                      : "border-slate-200 focus:border-[#0B6E4F] focus:bg-white focus:ring-2 focus:ring-[#E7F2EC]"
                  }`}
                  value={form.end_date}
                  min={form.start_date || undefined}
                  onChange={(e) => {
                    setForm({ ...form, end_date: e.target.value });
                    setTouched({ ...touched, end_date: true });
                  }}
                  onBlur={() => setTouched({ ...touched, end_date: true })}
                />
                {touched.end_date && currentErrors.end_date && (
                  <p className="mt-2 text-[13px] font-semibold text-rose-600 flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                    {currentErrors.end_date}
                  </p>
                )}
              </div>
            </div>
            
            {leaveDays !== null && leaveDays > 0 && (
              <div className="mt-5 flex items-center justify-between rounded-xl bg-[#F0FBF6] border border-[#0B6E4F]/20 px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded bg-[#0B6E4F] text-white">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#0B6E4F]">Total Duration</p>
                    <p className="text-sm font-bold text-slate-900">
                      {leaveDays} {leaveDays === 1 ? "Day" : "Days"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Document upload Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionLabel 
              title="Supporting document" 
              required={false}
              icon={<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>}
            />
            
            <p className="text-[13px] text-slate-500 mb-4 leading-relaxed">
              If your request requires documentation (like a medical certificate or doctor's note), upload it here.
            </p>

            {!file ? (
              <div
                className={`group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 transition-all ${
                  dragOver
                    ? "border-[#0B6E4F] bg-[#E7F2EC]"
                    : "border-slate-300 bg-slate-50 hover:border-[#0B6E4F] hover:bg-[#F0FBF6]"
                } ${touched.file && currentErrors.file ? "border-rose-400 bg-rose-50" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
              >
                <div className={`grid h-12 w-12 place-items-center rounded-full transition-colors ${dragOver ? "bg-[#0B6E4F] text-white" : "bg-white border border-slate-200 text-slate-500 group-hover:bg-[#0B6E4F] group-hover:text-white group-hover:border-transparent"}`}>
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-bold text-slate-800">
                    {dragOver ? "Drop file to attach" : "Click to browse or drag and drop"}
                  </p>
                  <p className="mt-1.5 text-[12px] font-medium text-slate-500">PDF, PNG or JPEG (Max {MAX_MB}MB)</p>
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
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="shrink-0 h-14 w-14 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                    {filePreview ? (
                      <img src={filePreview} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <FileIcon type={file.type} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-slate-900">{file.name}</p>
                    <div className="flex items-center gap-2 text-[12px] font-medium text-slate-500 mt-1">
                      <span className="uppercase tracking-wider font-bold">{file.type.split('/')[1] || "File"}</span>
                      <span>•</span>
                      <span>{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setFilePreview(null);
                    setTouched({ ...touched, file: true });
                  }}
                  className="shrink-0 grid h-9 w-9 place-items-center rounded-lg bg-slate-50 text-slate-400 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                  aria-label="Remove file"
                  title="Remove file"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
            
            {touched.file && currentErrors.file && (
              <p className="mt-3 text-[13px] font-semibold text-rose-600 flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                {currentErrors.file}
              </p>
            )}
          </div>

          {/* Request Summary */}
          {isComplete && (
            <div className="rounded-2xl border-2 border-[#0B6E4F]/20 bg-[#F0FBF6] p-6 shadow-sm overflow-hidden relative">
              <div className="absolute -top-10 -right-10 text-[#0B6E4F]/5">
                <svg viewBox="0 0 24 24" className="h-48 w-48" fill="currentColor"><path d="M12 2L2 22h20L12 2zm0 4l7.5 14h-15L12 6z"/></svg>
              </div>
              <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#0B6E4F] mb-4 relative z-10 flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                Request Summary
              </h3>
              <div className="grid grid-cols-2 gap-y-5 gap-x-8 text-sm relative z-10">
                <div>
                  <p className="text-slate-500 font-bold mb-1 text-[11px] uppercase tracking-wide">Leave Type</p>
                  <p className="font-bold text-slate-900">{LEAVE_TYPES.find(t => t.id === leaveType)?.label}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-bold mb-1 text-[11px] uppercase tracking-wide">Duration</p>
                  <p className="font-bold text-slate-900">{leaveDays} Day{leaveDays !== 1 ? 's' : ''}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-bold mb-1 text-[11px] uppercase tracking-wide">Dates</p>
                  <p className="font-bold text-slate-900">
                    {new Date(form.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} — {new Date(form.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 font-bold mb-1 text-[11px] uppercase tracking-wide">Supporting Document</p>
                  <p className="font-bold text-slate-900 truncate pr-4">{file ? file.name : "None provided"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Error */}
          {submitError && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 shadow-sm">
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p role="alert" className="text-[14px] font-bold text-rose-800">{submitError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={busy || !isComplete}
              className={`inline-flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-[15px] font-bold text-white shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]/40 focus:ring-offset-2 ${
                busy || !isComplete 
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none" 
                  : "bg-[#0B6E4F] hover:bg-[#0B6E4F]/90 hover:shadow-lg hover:-translate-y-0.5"
              }`}
            >
              {busy ? (
                <>
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                  </svg>
                  Submitting Request...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  Submit Leave Request
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center justify-center rounded-xl bg-white border-2 border-slate-200 px-6 py-3.5 text-[14px] font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
