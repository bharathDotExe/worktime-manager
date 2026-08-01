import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";
import { useEffect } from "react";

/** One parallax layer of the desk collage. */
function Layer({
  depth,
  mx,
  my,
  drift,
  className,
  rotate,
  children,
}: {
  depth: number;
  mx: MotionValue<number>;
  my: MotionValue<number>;
  drift: MotionValue<number>;
  className?: string;
  rotate: number;
  children: React.ReactNode;
}) {
  const x = useTransform(mx, (v) => v * depth);
  const y = useTransform([my, drift] as const, ([m, d]: number[]) => m * depth + d * depth * 3);
  return (
    <motion.div style={{ x, y, rotate }} className={`absolute ${className ?? ""}`}>
      {children}
    </motion.div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-dashed border-pencil/50 pb-1.5">
      <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-pencil">{label}</span>
      <span className="block text-[13px] font-medium text-ink">{value}</span>
    </div>
  );
}

export function HeroCollage({ scrollDrift }: { scrollDrift: MotionValue<number> }) {
  const reduce = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, { stiffness: 90, damping: 18, mass: 0.4 });
  const my = useSpring(rawY, { stiffness: 90, damping: 18, mass: 0.4 });

  useEffect(() => {
    if (reduce) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const wide = window.matchMedia("(min-width: 480px)").matches;
    if (!fine || !wide) return;
    const onMove = (e: MouseEvent) => {
      rawX.set((e.clientX / window.innerWidth - 0.5) * 40);
      rawY.set((e.clientY / window.innerHeight - 0.5) * 30);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [reduce, rawX, rawY]);

  const fade = (delay: number) =>
    reduce
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.4 } }
      : {
          initial: { opacity: 0, y: 26 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <div className="relative mx-auto h-[420px] w-full max-w-[440px] sm:h-[500px]" aria-hidden="true">
      {/* Back — calendar page */}
      <Layer depth={0.25} mx={mx} my={my} drift={scrollDrift} rotate={-4} className="left-0 top-4 w-[62%]">
        <motion.div
          {...fade(0.05)}
          className="paper-grain rounded-[3px] border border-pencil/30 bg-white/85 p-3 opacity-80 shadow-[var(--shadow-paper)]"
        >
          <div className="mb-2 flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-pencil">March</span>
            <span className="font-mono text-[10px] text-pencil">2026</span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <span
                key={i}
                className={`grid aspect-square place-items-center rounded-[2px] font-mono text-[8px] ${
                  i === 15 || i === 16 || i === 17
                    ? "bg-approve/15 text-approve"
                    : "text-pencil/70"
                }`}
              >
                {i + 1 <= 31 ? i + 1 : ""}
              </span>
            ))}
          </div>
        </motion.div>
      </Layer>

      {/* Mid — leave request form */}
      <Layer depth={0.5} mx={mx} my={my} drift={scrollDrift} rotate={3} className="right-0 top-10 w-[70%]">
        <motion.div
          {...fade(0.12)}
          className="paper-grain space-y-3 rounded-[3px] border border-pencil/30 bg-white p-4 shadow-[var(--shadow-lift)]"
        >
          <div className="flex items-center justify-between border-b border-ink/15 pb-2">
            <span className="font-display text-[13px] uppercase tracking-tight text-ink">Leave Request</span>
            <span className="font-mono text-[9px] text-pencil">#LR-0428</span>
          </div>
          <FieldRow label="Reason" value="Family wedding" />
          <FieldRow label="Start date" value="16 Mar 2026" />
          <FieldRow label="End date" value="18 Mar 2026" />
          <div className="flex items-center gap-2 pt-1">
            <span className="h-2 w-2 rounded-full bg-approve" />
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-pencil">
              medical-note.pdf attached
            </span>
          </div>
        </motion.div>
      </Layer>

      {/* Front — ID badge */}
      <Layer depth={0.8} mx={mx} my={my} drift={scrollDrift} rotate={-2} className="bottom-6 left-2 w-[46%]">
        <motion.div
          {...fade(0.2)}
          className="paper-grain rounded-[4px] border border-pencil/30 bg-kraft p-3 shadow-[var(--shadow-lift)]"
        >
          <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-ink/25" />
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-[3px] bg-ink font-display text-[13px] text-paper">
              AR
            </div>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-ink">Ananya Rao</p>
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-pencil">Employee · ID 0142</p>
            </div>
          </div>
        </motion.div>
      </Layer>

      {/* Accent — sticky note */}
      <Layer depth={1.05} mx={mx} my={my} drift={scrollDrift} rotate={-6} className="bottom-16 right-2 w-[38%]">
        <motion.div
          {...fade(0.28)}
          className="paper-grain rounded-[2px] bg-kraft p-3 shadow-[var(--shadow-paper)]"
        >
          <p className="text-[12px] italic leading-snug text-ink/80">
            &ldquo;remarks are mandatory — no silent approvals&rdquo;
          </p>
        </motion.div>
      </Layer>

      {/* Top — rubber stamp */}
      <motion.div
        style={{
          x: useTransform(mx, (v) => v * 1.3),
          y: useTransform([my, scrollDrift] as const, ([m, d]: number[]) => m * 1.3 + d * 4),
        }}
        className="absolute right-4 top-2 w-[45%]"
      >
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.9, rotate: 24 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: 8 }}
          transition={reduce ? { duration: 0.4 } : { duration: 0.22, delay: 0.55, ease: [0.3, 1.6, 0.5, 1] }}
        >
          <StampMark />
        </motion.div>
      </motion.div>
    </div>
  );
}

export function StampMark({ label = "APPROVED" }: { label?: string }) {
  return (
    <svg viewBox="0 0 220 96" className="h-auto w-full" role="img" aria-label={`${label} stamp`}>
      <defs>
        <filter id="stampgrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.62" numOctaves="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="4" />
        </filter>
      </defs>
      <g filter="url(#stampgrain)" opacity="0.9">
        <rect
          x="6"
          y="6"
          width="208"
          height="84"
          rx="6"
          fill="none"
          stroke="var(--stamp-red)"
          strokeWidth="5"
        />
        <rect
          x="16"
          y="16"
          width="188"
          height="64"
          rx="3"
          fill="none"
          stroke="var(--stamp-red)"
          strokeWidth="1.5"
        />
        <text
          x="110"
          y="58"
          textAnchor="middle"
          fill="var(--stamp-red)"
          fontFamily="'Archivo Black', sans-serif"
          fontSize="30"
          letterSpacing="2"
        >
          {label}
        </text>
      </g>
    </svg>
  );
}
