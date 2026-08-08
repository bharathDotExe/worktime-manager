import { useCallback, useEffect, useRef, useState } from "react";
import Layout from "../../components/Layout.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import api, { errorMessage } from "../../api/client";
import { MANAGER_LINKS } from "../../nav";
import { openDocument, fetchDocumentUrl } from "../../api/documents";
import { useToast } from "../../components/Toast.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { cacheGet, cacheSet, cacheInvalidate } from "../../api/cache";

const FILTERS = ["all", "pending", "approved", "rejected"];

function fmt(d) {
  return d
    ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "�";
}

function days(a, b) {
  if (!a || !b) return "�";
  const n = Math.round((new Date(b) - new Date(a)) / 86400000) + 1;
  return `${n} day${n === 1 ? "" : "s"}`;
}

function CalendarWidget({ leaves }) {
  const [date, setDate] = useState(new Date());

  const year = date.getFullYear();
  const month = date.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const prevMonthDays = new Date(year, month, 0).getDate();
  
  const days = [];
  
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, isCurrentMonth: false, monthOffset: -1 });
  }
  
  const today = new Date();
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, isCurrentMonth: true, monthOffset: 0 });
  }
  
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({ day: i, isCurrentMonth: false, monthOffset: 1 });
  }

  const leaveMap = {}; 
  
  leaves.forEach(leave => {
    if (!leave.start_date || !leave.end_date) return;
    
    let current = new Date(leave.start_date);
    const end = new Date(leave.end_date);
    current.setHours(0,0,0,0);
    end.setHours(0,0,0,0);
    
    while (current <= end) {
      const dateString = `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`;
      if (!leaveMap[dateString] || leave.status === 'pending') {
         leaveMap[dateString] = leave.status; 
      }
      current.setDate(current.getDate() + 1);
    }
  });

  const nextMonth = () => setDate(new Date(year, month + 1, 1));
  const prevMonth = () => setDate(new Date(year, month - 1, 1));

  return (
    <section className="rounded-[20px] border border-[#E2E8F5] bg-white px-6 py-6 xl:p-7 shadow-[0_4px_24px_rgba(22,55,120,0.04)]">
      <h2 className="text-[15px] font-bold text-elms-ink mb-4">Calendar</h2>
      <div className="flex items-center justify-between mb-4 px-2">
        <button onClick={prevMonth} className="text-slate-400 hover:text-slate-600 transition-colors">&lt;</button>
        <span className="text-[14px] font-semibold text-elms-ink">
          {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={nextMonth} className="text-slate-400 hover:text-slate-600 transition-colors">&gt;</button>
      </div>
      
      <div className="grid grid-cols-7 text-center mb-2">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
          <div key={day} className="text-[10px] font-bold text-slate-400">{day}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-y-2 text-center text-[13px] font-medium">
        {days.map((d, i) => {
          let cellDate = new Date(year, month + d.monthOffset, d.day);
          const isToday = cellDate.getDate() === today.getDate() && cellDate.getMonth() === today.getMonth() && cellDate.getFullYear() === today.getFullYear();
          const dateString = `${cellDate.getFullYear()}-${cellDate.getMonth()}-${cellDate.getDate()}`;
          const leaveStatus = leaveMap[dateString];
          
          let containerClass = "py-1.5 relative mx-1 ";
          let textClass = d.isCurrentMonth ? "text-slate-700" : "text-slate-300";
          
          if (isToday) {
            containerClass += "bg-[#F4F7FF] rounded-full ";
            textClass = "text-[#1769F0]";
          }
          
          return (
            <div key={i} className={`${containerClass} ${textClass}`}>
              {d.day}
              {leaveStatus === 'approved' && !isToday && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#0B6E4F]"></span>
              )}
              {leaveStatus === 'pending' && !isToday && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#C98A1E]"></span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4 mt-6 text-[11px] font-medium text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#0B6E4F]"></span> Approved
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#C98A1E]"></span> Pending
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#1769F0]"></span> Today
        </div>
      </div>
    </section>
  );
}

function Avatar({ name = "", avatarUrl = null }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className="h-9 w-9 rounded-full object-cover" />;
  }
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#E7F2EC] text-xs font-bold uppercase text-elms-primary">
      {name.slice(0, 2)}
    </span>
  );
}

function ReviewModal({ leave, onClose, onDone }) {
  const [status, setStatus] = useState(null); // No default selection to force a conscious choice
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [expandedDoc, setExpandedDoc] = useState(false);
  const [docPreview, setDocPreview] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Extract a nice display name from email (e.g. divya.menon@gcu.in -> Divya Menon)
  const displayName = leave.employee_username.split('@')[0].split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  useEffect(() => {
    if (leave.has_document) {
      let active = true;
      fetchDocumentUrl(leave.id).then(res => {
        if (active) setDocPreview(res);
      }).catch(err => console.error("Failed to fetch document preview", err));
      return () => { active = false; };
    }
  }, [leave.id, leave.has_document]);

  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    const focusable = dialogRef.current?.querySelectorAll("button:not([disabled]), textarea:not([disabled]), a:not([disabled])");
    focusable?.[0]?.focus();
    function handleKeyDown(e) {
      if (e.key === "Escape" && !busy) {
        if (showConfirm) setShowConfirm(false);
        else onClose();
      }
      if (e.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [busy, onClose, showConfirm]);

  function handleConfirmClick() {
    if (!status) return setError("Please select Approve or Reject.");
    if (remarks.trim().length < 3) return setError("Decision remarks are required.");
    setError("");
    setShowConfirm(true);
  }

  async function submitDecision() {
    setBusy(true);
    try {
      await api.patch(`/leaves/${leave.id}`, { status, manager_remarks: remarks.trim() });
      onDone(status);
    } catch (err) {
      setError(errorMessage(err, "Could not update the request"));
      setShowConfirm(false);
    } finally {
      setBusy(false);
    }
  }

  // Derive leave type
  const r = (leave.reason || "").toLowerCase();
  let leaveType = "Leave Request";
  if (leave.reason.includes(" — ")) leaveType = leave.reason.split(" — ")[0].trim();
  else if (r.includes("annual")) leaveType = "Annual Leave";
  else if (r.includes("sick") || r.includes("unwell") || r.includes("medical")) leaveType = "Sick Leave";
  else if (r.includes("casual") || r.includes("personal") || r.includes("errand")) leaveType = "Casual Leave";
  else if (r.includes("family") || r.includes("emergency") || r.includes("bereavement")) leaveType = "Family Emergency";
  else if (r.includes("maternity") || r.includes("paternity") || r.includes("parental")) leaveType = "Maternity / Paternity";

  // If showing confirmation dialog
  if (showConfirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 text-center" ref={dialogRef}>
          <div className={`mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full ${status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
            {status === 'approved' ? (
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            )}
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {status === 'approved' ? 'Approve Leave Request?' : 'Reject Leave Request?'}
          </h3>
          <p className="text-sm text-slate-500 mb-8 px-2">
            {status === 'approved' 
              ? "Are you sure you want to approve this leave request? The employee will be notified immediately."
              : "Are you sure you want to reject this leave request? The employee will receive your remarks."}
          </p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={() => setShowConfirm(false)}
              disabled={busy}
              className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={submitDecision}
              disabled={busy}
              className={`rounded-lg px-6 py-2.5 text-sm font-bold text-white shadow-md transition flex items-center justify-center gap-2 ${
                status === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {busy ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                  Processing...
                </>
              ) : (
                `Yes, ${status === 'approved' ? 'Approve' : 'Reject'}`
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6">
      <div
        className="relative z-10 w-full max-w-2xl max-h-full rounded-2xl bg-white shadow-2xl flex flex-col"
        ref={dialogRef}
      >
        {/* Header - Employee Info */}
        <div className="flex items-start justify-between border-b border-slate-100 bg-white px-6 py-5 shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 shrink-0">
              <Avatar name={displayName} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">{displayName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[13px] font-medium text-slate-600">Employee</span>
                <span className="text-slate-300">•</span>
                <span className="text-[13px] text-slate-500">{leave.employee_username}</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 font-mono">
                  ID: REQ-{leave.id.toString().padStart(4, '0')}
                </span>
                <StatusBadge status={leave.status} />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 px-6 py-6 space-y-8 bg-slate-50/50">
          
          {/* Leave Information Grid */}
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 ml-1">Leave Details</h3>
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="grid grid-cols-2 divide-x divide-slate-100">
                <div className="p-4">
                  <p className="text-[11px] font-semibold text-slate-500 mb-1">Leave Type</p>
                  <p className="text-sm font-bold text-slate-900">{leaveType}</p>
                </div>
                <div className="p-4">
                  <p className="text-[11px] font-semibold text-slate-500 mb-1">Duration</p>
                  <p className="text-sm font-bold text-slate-900">{days(leave.start_date, leave.end_date)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/50">
                <div className="p-4">
                  <p className="text-[11px] font-semibold text-slate-500 mb-1">Dates</p>
                  <p className="text-[13px] font-medium text-slate-700">{fmt(leave.start_date)} — {fmt(leave.end_date)}</p>
                </div>
                <div className="p-4">
                  <p className="text-[11px] font-semibold text-slate-500 mb-1">Submitted On</p>
                  <p className="text-[13px] font-medium text-slate-700">{fmt(leave.created_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Reason Section */}
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 ml-1">Reason for Leave</h3>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[14px] text-slate-800 leading-relaxed whitespace-pre-wrap break-words">{leave.reason}</p>
            </div>
          </div>

          {/* Supporting Document */}
          {leave.has_document && (
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 ml-1">Supporting Document</h3>
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded bg-blue-100 text-blue-600">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-slate-800">{leave.document_name || 'Document.pdf'}</p>
                      <p className="text-[11px] text-slate-500">PDF Document • 1 File</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedDoc(!expandedDoc)}
                      className="text-[12px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 px-2.5 py-1.5 rounded transition"
                    >
                      {expandedDoc ? "Collapse" : "Expand"}
                    </button>
                    <button
                      type="button"
                      onClick={() => openDocument(leave.id)}
                      className="flex items-center gap-1.5 text-[12px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1.5 rounded transition"
                    >
                      Open Full Document
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className={`${expandedDoc ? "h-96" : "h-40"} transition-all duration-300 ease-in-out relative bg-slate-100`}>
                  {docPreview ? (
                    docPreview.type.startsWith("image/") ? (
                      <div className="h-full w-full p-4 flex items-center justify-center overflow-auto">
                        <img src={docPreview.url} alt="Attachment Preview" className="max-w-full max-h-full object-contain rounded shadow-sm" />
                      </div>
                    ) : (
                      <iframe src={docPreview.url} className="w-full h-full" title="Attachment Preview"></iframe>
                    )
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                        </svg>
                        <span className="text-xs font-medium">Loading preview...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Decision Section */}
          <div className="pt-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 ml-1">Decision</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setStatus("approved")}
                className={`group relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all duration-200 ${
                  status === "approved"
                    ? "border-emerald-500 bg-emerald-50 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]"
                    : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/50"
                }`}
              >
                <div className={`grid h-10 w-10 place-items-center rounded-full transition-colors ${
                  status === "approved" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-500"
                }`}>
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <span className={`font-bold ${status === "approved" ? "text-emerald-700" : "text-slate-600"}`}>Approve</span>
              </button>
              
              <button
                type="button"
                onClick={() => setStatus("rejected")}
                className={`group relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all duration-200 ${
                  status === "rejected"
                    ? "border-rose-500 bg-rose-50 shadow-[0_0_0_4px_rgba(244,63,94,0.1)]"
                    : "border-slate-200 bg-white hover:border-rose-200 hover:bg-rose-50/50"
                }`}
              >
                <div className={`grid h-10 w-10 place-items-center rounded-full transition-colors ${
                  status === "rejected" ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-rose-100 group-hover:text-rose-500"
                }`}>
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </div>
                <span className={`font-bold ${status === "rejected" ? "text-rose-700" : "text-slate-600"}`}>Reject</span>
              </button>
            </div>
          </div>

          {/* Decision Remarks */}
          <div>
            <div className="flex items-center justify-between mb-2 ml-1">
              <label htmlFor="remarks" className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Decision Remarks
              </label>
              <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Required</span>
            </div>
            <textarea
              id="remarks"
              rows={4}
              placeholder="Explain the reason for your decision or provide additional instructions..."
              className={`w-full rounded-xl border bg-white px-4 py-3 text-[14px] text-slate-800 placeholder-slate-400 outline-none transition-all shadow-sm resize-none ${
                error && error.includes("remarks") ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20" : "border-slate-200 focus:border-elms-primary focus:ring-2 focus:ring-elms-primary/20"
              }`}
              value={remarks}
              onChange={(e) => {
                setRemarks(e.target.value);
                if (error) setError("");
              }}
            />
            {error && (
              <p className="mt-2 text-[13px] font-medium text-rose-600 flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                {error}
              </p>
            )}
          </div>
          
        </div>

        {/* Sticky Action Bar */}
        <div className="border-t border-slate-200 bg-white px-6 py-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end shrink-0 rounded-b-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
          <button
            className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition focus:outline-none focus:ring-2 focus:ring-slate-200"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="rounded-lg bg-elms-ink px-8 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-elms-ink/90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-elms-ink/40"
            onClick={handleConfirmClick}
            disabled={!status || remarks.trim().length < 3}
          >
            Confirm Decision
          </button>
        </div>
      </div>
    </div>
  );
}

const TILES = [
  {
    key: "total",
    label: "Total Requests",
    sub: "This month",
    tone: "bg-[#F4F7FF]",
    img: "/total_requests_icon.png",
    isPending: false,
  },
  {
    key: "approved",
    label: "Approved",
    sub: "This month",
    tone: "bg-[#E6F8F0]",
    img: "/approved_icon.png",
    isPending: false,
  },
  {
    key: "pending",
    label: "Pending Review",
    sub: "Requires action",
    tone: "bg-[#FFF4E5]",
    img: "/pending_icon.png",
    isPending: true,
  },
  {
    key: "rejected",
    label: "Rejected",
    sub: "This month",
    tone: "bg-[#F8E9E8]",
    img: "/rejected_icon.png",
    isPending: false,
    imgClass: "scale-[0.8]",
  },
];

/* Derive leave type from the reason string */
function leaveTypeFromReason(reason = "") {
  const r = reason.toLowerCase();
  // New format: "Annual Leave — some detail"
  if (reason.includes(" — ")) return reason.split(" — ")[0].trim();
  // Legacy keyword matching
  if (r.includes("annual")) return "Annual Leave";
  if (r.includes("sick") || r.includes("unwell") || r.includes("medical")) return "Sick Leave";
  if (r.includes("casual") || r.includes("personal") || r.includes("errand")) return "Casual Leave";
  if (r.includes("family") || r.includes("emergency") || r.includes("bereavement")) return "Family Emergency";
  if (r.includes("maternity") || r.includes("paternity") || r.includes("parental")) return "Maternity / Paternity";
  return "Leave Request";
}

/* Skeleton row */
function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-slate-100 shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3 w-28 rounded bg-slate-100" />
            <div className="h-2.5 w-20 rounded bg-slate-100" />
          </div>
        </div>
      </td>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-3 w-16 rounded bg-slate-100" />
        </td>
      ))}
    </tr>
  );
}

/* Proper empty state */
function EmptyState({ filter }) {
  return (
    <tr>
      <td colSpan="7">
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-slate-100">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18M8 14h4M8 18h2" />
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-slate-800">
            {filter === "all" ? "No leave requests yet" : `No ${filter} requests`}
          </p>
          <p className="mt-1.5 max-w-[280px] text-sm text-slate-500 leading-relaxed">
            {filter === "all"
              ? "Leave requests from your employees will appear here once they are submitted."
              : `There are currently no requests with a "${filter}" status.`}
          </p>
        </div>
      </td>
    </tr>
  );
}

export default function LeaveRequests() {
  const [filter, setFilter] = useState("all");
  const [leaves, setLeaves] = useState([]);
  const [summary, setSummary] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState(null);
  const { pushToast } = useToast();
  const { user } = useAuth();

  const load = useCallback(async () => {
    setError("");

    // Hydrate from cache instantly (skip the loading spinner)
    const cacheKey = `mgr_leaves_${filter}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      setLeaves(cached.leaves);
      setSummary(cached.summary);
      setBalances(cached.balances);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const visibleRequest = api.get("/leaves", {
        params: filter === "all" ? {} : { status: filter },
      });
      const summaryRequest = filter === "all" ? visibleRequest : api.get("/leaves");
      const balancesRequest = api.get("/leaves/balances");
      
      const [{ data: visibleData }, { data: summaryData }, { data: balancesData }] = await Promise.all([
        visibleRequest,
        summaryRequest,
        balancesRequest,
      ]);
      const result = {
        leaves: visibleData.leaves || [],
        summary: summaryData.leaves || [],
        balances: balancesData.balances || [],
      };
      cacheSet(cacheKey, result, 30_000); // 30s TTL for manager data
      setLeaves(result.leaves);
      setSummary(result.summary);
      setBalances(result.balances);
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

  const counts = {
    total: summary.length,
    approved: summary.filter((l) => l.status === "approved").length,
    pending: summary.filter((l) => l.status === "pending").length,
    rejected: summary.filter((l) => l.status === "rejected").length,
  };

  return (
    <Layout links={MANAGER_LINKS}>
    <div className="pb-8">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-[22px] sm:text-[26px] font-bold tracking-tight text-elms-ink">Manager Dashboard</h1>
          <p className="mt-1 text-[13px] sm:text-[14px] font-medium text-slate-500">
            Welcome back, <span className="font-semibold text-slate-700">{user?.username?.split(" ")[0] || "Manager"}</span>. Here is your team&apos;s leave activity.
          </p>
        </div>
        {counts.pending > 0 && (
          <div className="self-start flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 sm:px-4 sm:py-2.5">
            <span className="flex h-2 w-2 shrink-0 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[12px] sm:text-[13px] font-semibold text-amber-700">
              {counts.pending} pending {counts.pending === 1 ? "request" : "requests"}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5 xl:gap-8 items-stretch">
        <div className="space-y-5 xl:space-y-8">
          <section className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {TILES.map((t) => (
              <div
                key={t.key}
                className="group flex items-center gap-2 sm:gap-3 xl:gap-4 rounded-[14px] sm:rounded-[16px] border border-[#E2E8F5] bg-white p-3 sm:p-4 shadow-[0_2px_12px_rgba(22,55,120,0.03)] hover:shadow-[0_4px_20px_rgba(22,55,120,0.07)] transition-shadow"
              >
                <span className={`grid h-[44px] w-[44px] sm:h-[56px] sm:w-[56px] xl:h-[64px] xl:w-[64px] shrink-0 place-items-center rounded-[10px] sm:rounded-[14px] xl:rounded-[16px] ${t.tone} transition-transform duration-200 group-hover:scale-105`}>
                  <img
                    src={t.img}
                    alt={t.label}
                    className={`h-full w-full object-contain ${t.imgClass || 'scale-[1.7]'}`}
                    aria-hidden="true"
                  />
                </span>
                <div className="min-w-0">
                  {loading ? (
                    <div className="space-y-1.5 animate-pulse">
                      <div className="h-5 w-8 rounded bg-slate-100" />
                      <div className="h-2.5 w-16 rounded bg-slate-100" />
                      <div className="h-2 w-12 rounded bg-slate-100" />
                    </div>
                  ) : (
                    <>
                      <p className="text-[18px] sm:text-[22px] xl:text-[26px] font-extrabold leading-none text-elms-ink tabular-nums">
                        {counts[t.key] ?? 0}
                      </p>
                      <p className="mt-1 text-[10px] sm:text-[12px] xl:text-[13px] font-semibold text-slate-700 leading-tight">{t.label}</p>
                      {t.isPending ? (
                        <span className="mt-0.5 inline-block rounded-full bg-amber-100 px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-wide text-amber-700">
                          Action
                        </span>
                      ) : (
                        <p className="mt-0.5 text-[9px] sm:text-[11px] text-slate-400">{t.sub}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </section>

          <section className="rounded-[14px] sm:rounded-[16px] border border-[#E2E8F5] bg-white shadow-[0_2px_12px_rgba(22,55,120,0.03)] overflow-hidden">
            {/* Header */}
            <div className="flex flex-col gap-3 border-b border-[#E2E8F5] px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6 sm:py-4 xl:py-5">
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] sm:text-[17px] font-bold text-elms-ink">Leave Requests</h2>
                {!loading && leaves.length > 0 && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
                    {leaves.length}
                  </span>
                )}
              </div>
              {/* Filter tabs */}
              <div className="flex items-center gap-1 rounded-lg border border-[#E2E8F5] bg-slate-50 p-1 self-start">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-md px-2.5 py-1 text-[11px] sm:text-[12px] font-semibold capitalize transition-colors ${
                      filter === f
                        ? "bg-white text-elms-ink shadow-sm border border-[#E2E8F5]"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                    {f === "pending" && counts.pending > 0 && (
                      <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
                        {counts.pending}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden">
              {loading ? (
                <div className="divide-y divide-slate-100">
                  {[1,2,3].map(i => (
                    <div key={i} className="animate-pulse flex items-center gap-3 px-4 py-4">
                      <div className="h-10 w-10 rounded-full bg-slate-100 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-32 rounded bg-slate-100" />
                        <div className="h-2.5 w-20 rounded bg-slate-100" />
                      </div>
                      <div className="h-5 w-16 rounded-full bg-slate-100" />
                    </div>
                  ))}
                </div>
              ) : empty ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100">
                    <svg viewBox="0 0 24 24" className="h-7 w-7 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M8 14h4M8 18h2" /></svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">{filter === "all" ? "No leave requests yet" : `No ${filter} requests`}</p>
                  <p className="mt-1 text-xs text-slate-400">Requests will appear here once submitted.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {leaves.map((l) => (
                    <li
                      key={l.id}
                      className="px-4 py-3.5 cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors"
                      onClick={() => setActive(l)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && setActive(l)}
                      aria-label={`Review leave request from ${l.employee_username}`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={l.employee_full_name || l.employee_username} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-[13px] font-bold text-elms-ink">{l.employee_full_name || l.employee_username}</p>
                            <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              l.status === "approved" ? "bg-[#E6F8F0] text-[#0B6E4F]" :
                              l.status === "pending"  ? "bg-[#FFF4E5] text-[#C98A1E]" :
                              "bg-[#F8E9E8] text-[#B23B34]"
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                l.status === "approved" ? "bg-[#0B6E4F]" :
                                l.status === "pending"  ? "bg-[#C98A1E]" :
                                "bg-[#B23B34]"
                              }`} />
                              {l.status.charAt(0).toUpperCase() + l.status.slice(1)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-slate-500">{leaveTypeFromReason(l.reason)}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[11px] text-slate-500">{fmt(l.start_date)} — {fmt(l.end_date)}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[11px] font-medium text-slate-600">{days(l.start_date, l.end_date)}</span>
                          </div>
                        </div>
                        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-[14px]">
                <thead className="border-b border-[#E2E8F5] bg-slate-50/60 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3.5 whitespace-nowrap">Employee</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Leave Type</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">From</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">To</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Duration</th>
                    <th className="px-4 py-3.5 whitespace-nowrap">Status</th>
                    <th className="px-6 py-3.5 text-right whitespace-nowrap">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F5]">
                  {loading ? (
                    [1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)
                  ) : empty ? (
                    <EmptyState filter={filter} />
                  ) : (
                    leaves.map((l) => (
                      <tr
                        key={l.id}
                        className="cursor-pointer transition-colors hover:bg-[#F8FAFB] active:bg-slate-100 group"
                        onClick={() => setActive(l)}
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && setActive(l)}
                        role="button"
                        aria-label={`Review leave request from ${l.employee_username}`}
                      >
                        {/* Employee */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={l.employee_full_name || l.employee_username} />
                            <div className="min-w-0 max-w-[160px]">
                              <p className="truncate text-[14px] font-bold text-elms-ink" title={l.employee_full_name || l.employee_username}>
                                {l.employee_full_name || l.employee_username}
                              </p>
                              <p className="truncate text-[12px] font-medium text-slate-500">
                                {l.employee_department || l.employee_username}
                              </p>
                            </div>
                          </div>
                        </td>
                        {/* Leave Type */}
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[12px] font-medium text-slate-700 whitespace-nowrap">
                            {leaveTypeFromReason(l.reason)}
                          </span>
                        </td>
                        {/* Dates */}
                        <td className="whitespace-nowrap px-4 py-4 text-[13px] text-slate-600">{fmt(l.start_date)}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-[13px] text-slate-600">{fmt(l.end_date)}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-[13px] font-medium text-slate-700">{days(l.start_date, l.end_date)}</td>
                        {/* Status */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${
                            l.status === "approved" ? "bg-[#E6F8F0] text-[#0B6E4F]" :
                            l.status === "pending"  ? "bg-[#FFF4E5] text-[#C98A1E]" :
                            "bg-[#F8E9E8] text-[#B23B34]"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              l.status === "approved" ? "bg-[#0B6E4F]" :
                              l.status === "pending"  ? "bg-[#C98A1E]" :
                              "bg-[#B23B34]"
                            }`} />
                            {l.status.charAt(0).toUpperCase() + l.status.slice(1)}
                          </span>
                        </td>
                        {/* Submitted + Review hint */}
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <span className="text-[13px] text-slate-500">{fmt(l.created_at)}</span>
                          {l.status === "pending" && (
                            <span className="ml-3 hidden group-hover:inline-flex items-center gap-1 text-[11px] font-semibold text-[#1769F0]">
                              Review
                              <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                                <path d="M3.33331 8H12.6666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M8 3.33337L12.6667 8.00004L8 12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!loading && !empty && (
              <div className="flex items-center justify-between border-t border-[#E2E8F5] px-4 sm:px-6 py-3 text-[12px] text-slate-500 bg-slate-50/40">
                <span className="font-medium">
                  Showing <span className="font-bold text-slate-700">{leaves.length}</span> {leaves.length === 1 ? "request" : "requests"}
                  {filter !== "all" && <> — <span className="font-bold text-slate-700 capitalize">{filter}</span></>}
                </span>
                <div className="flex items-center gap-1">
                  <button className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors" aria-label="Previous page">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <button className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1769F0] text-[12px] font-bold text-white">
                    1
                  </button>
                  <button className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors" aria-label="Next page">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>

      {active && (
        <ReviewModal
          leave={active}
          onClose={() => setActive(null)}
          onDone={(status) => {
            setActive(null);
            cacheInvalidate("mgr_*");
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
