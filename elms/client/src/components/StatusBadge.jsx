const STYLES = {
  pending: "bg-[#FBF3E2] text-elms-pending ring-[#EBD9AE]",
  approved: "bg-[#E7F2EC] text-elms-primary ring-[#BFDCCE]",
  rejected: "bg-[#F8E9E8] text-elms-reject ring-[#E6C4C1]",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${
        STYLES[status] || "bg-slate-100 text-slate-700 ring-slate-200"
      }`}
    >
      {status}
    </span>
  );
}
