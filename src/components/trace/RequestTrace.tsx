export const TRACE_NODES = [
  { id: "client", label: "Client", detail: "submits request" },
  { id: "jwt", label: "Verify JWT", detail: "reject if missing or expired" },
  { id: "role", label: "Check role", detail: "reject if not authorized" },
  { id: "input", label: "Validate input", detail: "reject if malformed" },
  { id: "query", label: "Parameterized query", detail: "scoped to the caller's own data" },
];

function NodeGlyph({ index }: { index: number }) {
  const common = { stroke: "var(--elms-primary)", strokeWidth: 1.4, fill: "none" } as const;
  switch (index) {
    case 0:
      return (
        <g {...common}>
          <rect x="-7" y="-6" width="14" height="11" rx="1.5" />
          <path d="M-4 8h8" />
        </g>
      );
    case 1:
      return (
        <g {...common}>
          <rect x="-6" y="-1" width="12" height="9" rx="1.5" />
          <path d="M-3.5 -1v-3a3.5 3.5 0 017 0v3" />
        </g>
      );
    case 2:
      return (
        <g {...common}>
          <circle cx="0" cy="-3" r="3.5" />
          <path d="M-6 8c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
        </g>
      );
    case 3:
      return (
        <g {...common}>
          <path d="M-6.5 -7h13v14h-13z" />
          <path d="M-3.5 0l2.5 2.5L4 -3" />
        </g>
      );
    default:
      return (
        <g {...common}>
          <ellipse cx="0" cy="-4.5" rx="6.5" ry="2.5" />
          <path d="M-6.5 -4.5v9c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-9" />
          <path d="M-6.5 0.5c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5" />
        </g>
      );
  }
}

/** Horizontal request-lifecycle diagram. Meaning is duplicated in plain text below. */
export default function RequestTrace({ large = false }: { large?: boolean }) {
  const W = 1040;
  const H = large ? 150 : 132;
  const y = 52;
  const step = (W - 240) / (TRACE_NODES.length - 1);

  return (
    <div>
      {/* Desktop / tablet diagram */}
      <div className="hidden md:block">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label="Request lifecycle: client submits request, verify JWT, check role, validate input, parameterized query scoped to the caller's own data."
        >
          <line
            x1="120"
            y1={y}
            x2={W - 120}
            y2={y}
            stroke="var(--elms-line)"
            strokeWidth="1"
          />
          <line
            x1="120"
            y1={y}
            x2={W - 120}
            y2={y}
            stroke="var(--elms-primary)"
            strokeWidth="1.5"
            className="elms-draw"
          />
          {TRACE_NODES.map((n, i) => {
            const cx = 120 + i * step;
            return (
              <g
                key={n.id}
                className="elms-node"
                style={{ animationDelay: `${150 + i * 180}ms` }}
              >
                <circle cx={cx} cy={y} r="19" fill="var(--elms-surface)" stroke="var(--elms-line)" />
                <g transform={`translate(${cx} ${y})`}>
                  <NodeGlyph index={i} />
                </g>
                <text
                  x={cx}
                  y={y + 42}
                  textAnchor="middle"
                  fontSize={large ? 14 : 13}
                  fontWeight="600"
                  fill="var(--elms-ink)"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {n.label}
                </text>
                <text
                  x={cx}
                  y={y + 60}
                  textAnchor="middle"
                  fontSize="11"
                  fill="var(--elms-ink-muted)"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {n.detail}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Mobile: same sequence, stacked */}
      <ol className="md:hidden divide-y divide-elms-line border-y border-elms-line">
        {TRACE_NODES.map((n, i) => (
          <li key={n.id} className="flex items-start gap-3 py-3">
            <span className="mt-0.5 font-mono text-[11px] text-elms-primary">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span>
              <span className="block text-sm font-semibold text-elms-ink">{n.label}</span>
              <span className="block font-mono text-[11px] text-elms-muted">{n.detail}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
