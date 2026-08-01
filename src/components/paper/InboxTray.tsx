import { motion, useReducedMotion } from "motion/react";

const SHEETS = [
  { name: "Rohit K.", meta: "12–14 Apr", status: "APPROVED" },
  { name: "Meera S.", meta: "02–03 Apr", status: "PENDING" },
  { name: "Dev P.", meta: "28–30 Mar", status: "REJECTED" },
];

/** Illustrated inbox tray: a stack of request forms with the pending one highlighted. */
export function InboxTray() {
  const reduce = useReducedMotion();
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
      <div className="space-y-3">
        {SHEETS.map((s, i) => {
          const pending = s.status === "PENDING";
          return (
            <motion.div
              key={s.name}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.09, ease: [0.16, 1, 0.3, 1] }}
              style={{ rotate: [-1.5, 1, -0.5][i] ?? 0 }}
              className={`paper-grain flex items-center justify-between rounded-[3px] border bg-white px-4 py-3 shadow-[var(--shadow-paper)] ${
                pending ? "border-stamp/60 ring-2 ring-stamp/20" : "border-pencil/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-7 place-items-end rounded-[2px] border border-pencil/40 bg-paper p-1">
                  <span className="block h-0.5 w-full bg-pencil/50" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-ink">{s.name}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-pencil">{s.meta}</p>
                </div>
              </div>
              <span
                className={`font-mono text-[10px] font-semibold uppercase tracking-[0.16em] ${
                  s.status === "APPROVED"
                    ? "text-approve"
                    : s.status === "REJECTED"
                      ? "text-stamp"
                      : "text-ink"
                }`}
              >
                {s.status}
              </span>
            </motion.div>
          );
        })}
      </div>
      {/* tray lip */}
      <div className="mt-1 h-4 rounded-b-[6px] border-x border-b border-pencil/45 bg-kraft shadow-[var(--shadow-paper)]" />
      <div className="mx-auto h-2 w-[86%] rounded-b-[4px] bg-pencil/25" />
    </div>
  );
}
