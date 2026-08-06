import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

/* ═══════════════════════════════════════════════════════════════════════════
   SYSTEM ARCHITECTURE
   ─ Compact view : CSS-scaled to fit container (full tree visible, smaller)
   ─ Expanded view: Figma-style pan / zoom canvas via react-zoom-pan-pinch
   ─ Animation    : shared state drives both views simultaneously
   Colors: --elms-* only.
═══════════════════════════════════════════════════════════════════════════ */

// ── Natural SVG canvas size (always rendered at these px, then scaled) ────────
const VW = 640;
const VH = 858;

// ── Key x-coordinates ─────────────────────────────────────────────────────────
const MX  = 270;   // main column center-x
const LX  = 90;    // left rejection center-x
const RX  = 510;   // right branch center-x (multer, r400)
const LPX = 14;    // response-return loop x

const MONO = "'JetBrains Mono','IBM Plex Mono',ui-monospace,monospace";

// ── Node specs ────────────────────────────────────────────────────────────────
const ND = {
  client: { cx: MX,  cy: 50,  hw: 78, hh: 22, type: "success", label: "Client (React + Vite)",  sub: null,                     icon: "ui"     },
  jwt:    { cx: MX,  cy: 175, hw: 78, hh: 22, type: "success", label: "Verify JWT",             sub: null,                     icon: "lock"   },
  r401:   { cx: LX,  cy: 175, hw: 65, hh: 20, type: "reject",  label: "401 Unauthorized",       sub: null,                     icon: null     },
  role:   { cx: MX,  cy: 308, hw: 78, hh: 22, type: "success", label: "Check role",             sub: null,                     icon: "shield" },
  r403:   { cx: LX,  cy: 308, hw: 65, hh: 20, type: "reject",  label: "403 Forbidden",          sub: null,                     icon: null     },
  zod:    { cx: MX,  cy: 438, hw: 80, hh: 22, type: "success", label: "Validate input (Zod)",   sub: null,                     icon: "check"  },
  r400:   { cx: RX,  cy: 438, hw: 70, hh: 20, type: "reject",  label: "400 Bad Request",        sub: null,                     icon: null     },
  ctrl:   { cx: MX,  cy: 562, hw: 78, hh: 22, type: "success", label: "Route controller",       sub: null,                     icon: "branch" },
  multer: { cx: RX,  cy: 562, hw: 78, hh: 27, type: "cond",    label: "Multer",                 sub: "type + size check",      icon: "clip"   },
  query:  { cx: MX,  cy: 688, hw: 83, hh: 22, type: "success", label: "Parameterized query",    sub: "scoped to caller",       icon: null     },
  db:     { cx: MX,  cy: 808, hw: 83, hh: 27, type: "db",      label: "PostgreSQL",             sub: "users / leave_requests", icon: null     },
};

// Geometry shortcuts
const nc = id => ({ x: ND[id].cx,              y: ND[id].cy              });
const nb = id => ({ x: ND[id].cx,              y: ND[id].cy + ND[id].hh });
const nt = id => ({ x: ND[id].cx,              y: ND[id].cy - ND[id].hh });
const nl = id => ({ x: ND[id].cx - ND[id].hw, y: ND[id].cy              });
const nr = id => ({ x: ND[id].cx + ND[id].hw, y: ND[id].cy              });

// ── Edge definitions ──────────────────────────────────────────────────────────
const EDGES = [
  { id: "client-jwt",   d: `M${MX},${nb("client").y} L${MX},${nt("jwt").y}`,       type: "main",   label: "HTTPS + Bearer JWT", lx: MX+6, ly: Math.round((nb("client").y+nt("jwt").y)/2),   la: "start" },
  { id: "jwt-role",     d: `M${MX},${nb("jwt").y} L${MX},${nt("role").y}`,         type: "main",   label: "valid",              lx: MX+6, ly: Math.round((nb("jwt").y+nt("role").y)/2),     la: "start" },
  { id: "role-zod",     d: `M${MX},${nb("role").y} L${MX},${nt("zod").y}`,         type: "main",   label: "authorized",         lx: MX+6, ly: Math.round((nb("role").y+nt("zod").y)/2),    la: "start" },
  { id: "zod-ctrl",     d: `M${MX},${nb("zod").y} L${MX},${nt("ctrl").y}`,         type: "main",   label: "valid",              lx: MX+6, ly: Math.round((nb("zod").y+nt("ctrl").y)/2),    la: "start" },
  { id: "ctrl-query",   d: `M${MX},${nb("ctrl").y} L${MX},${nt("query").y}`,       type: "main",   label: "no file",            lx: MX+6, ly: Math.round((nb("ctrl").y+nt("query").y)/2),  la: "start" },
  { id: "query-db",     d: `M${MX},${nb("query").y} L${MX},${nt("db").y}`,         type: "main",   label: null, lx:0,ly:0,la:"middle" },
  { id: "jwt-r401",     d: `M${nl("jwt").x},${ND.jwt.cy} L${nr("r401").x},${ND.r401.cy}`,     type: "reject", label: "invalid/expired",  lx: Math.round((nl("jwt").x+nr("r401").x)/2),   ly: ND.jwt.cy-9,  la: "middle" },
  { id: "role-r403",    d: `M${nl("role").x},${ND.role.cy} L${nr("r403").x},${ND.role.cy}`,   type: "reject", label: "wrong role",       lx: Math.round((nl("role").x+nr("r403").x)/2),  ly: ND.role.cy-9, la: "middle" },
  { id: "zod-r400",     d: `M${nr("zod").x},${ND.zod.cy} L${nl("r400").x},${ND.r400.cy}`,     type: "reject", label: "malformed",        lx: Math.round((nr("zod").x+nl("r400").x)/2),   ly: ND.zod.cy-9,  la: "middle" },
  { id: "ctrl-multer",  d: `M${nr("ctrl").x},${ND.ctrl.cy} L${nl("multer").x},${ND.multer.cy}`, type: "cond", label: "file attached",    lx: Math.round((nr("ctrl").x+nl("multer").x)/2), ly: ND.ctrl.cy-9, la: "middle" },
  { id: "multer-query", d: `M${RX},${nb("multer").y} L${RX},${ND.query.cy} L${nr("query").x},${ND.query.cy}`, type: "cond", label: null, lx:0,ly:0,la:"middle" },
  { id: "response",     d: `M${nl("db").x},${ND.db.cy} L${LPX},${ND.db.cy} L${LPX},${ND.client.cy} L${nl("client").x},${ND.client.cy}`, type: "loop", label: "response", lx: LPX+5, ly: Math.round((ND.db.cy+ND.client.cy)/2), la: "start" },
];

const FLASH_EDGE_MAP = { r401: "jwt-r401", r403: "role-r403", r400: "zod-r400", multer: "ctrl-multer" };

// ── Animation ─────────────────────────────────────────────────────────────────
function easeInOut(t) { return t < 0.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2; }

function buildTimeline(mode) {
  const T = 460;
  const s = [];
  const push = (to, dur, extra={}) => s.push({ x: to.x, y: to.y, dur, ...extra });

  push(nc("client"), 0,  { nodeId: "client" });
  push(nc("jwt"),    T,  { nodeId: "jwt",   edgeId: "client-jwt", flash: "r401" });
  if (mode === "r401") { push(nc("r401"), T, { nodeId:"r401", edgeId:"jwt-r401", done:true }); return s; }

  push(nc("role"),   T,  { nodeId: "role",  edgeId: "jwt-role",   flash: "r403" });
  if (mode === "r403") { push(nc("r403"), T, { nodeId:"r403", edgeId:"role-r403", done:true }); return s; }

  push(nc("zod"),    T,  { nodeId: "zod",   edgeId: "role-zod",   flash: "r400" });
  if (mode === "r400") { push(nc("r400"), T, { nodeId:"r400", edgeId:"zod-r400", done:true }); return s; }

  push(nc("ctrl"),   T,  { nodeId: "ctrl",  edgeId: "zod-ctrl",   flash: "multer" });
  push(nc("query"),  T,  { nodeId: "query", edgeId: "ctrl-query" });
  push(nc("db"),     T,  { nodeId: "db",    edgeId: "query-db"   });
  push(nl("db"),     180, { edgeId: "response" });
  push({ x: LPX, y: ND.db.cy },     200);
  push({ x: LPX, y: ND.client.cy }, 640);
  push(nl("client"),  180);
  push(nc("client"),  200, { nodeId:"client", done:true });
  return s;
}

function useTokenAnimation(prefersReduced) {
  const [tokenPos,    setTokenPos]    = useState(null);
  const [flashedNode, setFlashedNode] = useState(null);
  const [litNodes,    setLitNodes]    = useState(new Set());
  const [litEdges,    setLitEdges]    = useState(new Set());
  const [animating,   setAnimating]   = useState(false);

  const rafRef   = useRef(null);
  const stRef    = useRef({ timeline:[], idx:0, t0:null, prev:null, running:false });
  const flashRef = useRef(null);

  const cancelAll = useCallback(() => {
    if (rafRef.current)   cancelAnimationFrame(rafRef.current);
    if (flashRef.current) clearTimeout(flashRef.current);
    stRef.current.running = false;
  }, []);

  const tick = useCallback((now) => {
    const st = stRef.current;
    if (!st.running) return;
    const { timeline, idx } = st;
    if (idx >= timeline.length) { setTokenPos(null); setAnimating(false); return; }

    const step = timeline[idx];
    if (st.t0 === null) {
      st.t0 = now;
      if (step.nodeId) setLitNodes(prev => new Set([...prev, step.nodeId]));
      if (step.edgeId) setLitEdges(prev => new Set([...prev, step.edgeId]));
      if (step.flash) {
        setFlashedNode(step.flash);
        if (flashRef.current) clearTimeout(flashRef.current);
        flashRef.current = setTimeout(() => setFlashedNode(f => f===step.flash ? null : f), 300);
      }
    }

    const elapsed  = now - st.t0;
    const progress = step.dur > 0 ? Math.min(elapsed/step.dur, 1) : 1;
    const t        = easeInOut(progress);
    const prev     = st.prev;

    if (prev && step.dur > 0) {
      setTokenPos({ x: prev.x+(step.x-prev.x)*t, y: prev.y+(step.y-prev.y)*t });
    } else {
      setTokenPos({ x: step.x, y: step.y });
    }

    if (progress >= 1) {
      if (step.done) { setTokenPos(null); setAnimating(false); st.running=false; return; }
      st.prev = { x: step.x, y: step.y };
      st.idx  = idx+1;
      st.t0   = null;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback((mode) => {
    cancelAll();
    setFlashedNode(null); setLitNodes(new Set()); setLitEdges(new Set()); setAnimating(true);

    if (prefersReduced) {
      const endNodes = { success:["client","jwt","role","zod","ctrl","query","db"], r401:["client","jwt","r401"], r403:["client","jwt","role","r403"], r400:["client","jwt","role","zod","r400"] }[mode] ?? [];
      const endEdges = { success:["client-jwt","jwt-role","role-zod","zod-ctrl","ctrl-query","query-db","response"], r401:["client-jwt","jwt-r401"], r403:["client-jwt","jwt-role","role-r403"], r400:["client-jwt","jwt-role","role-zod","zod-r400"] }[mode] ?? [];
      setLitNodes(new Set(endNodes)); setLitEdges(new Set(endEdges));
      setTokenPos(null); setAnimating(false);
      return;
    }

    const timeline = buildTimeline(mode);
    stRef.current  = { timeline, idx:0, t0:null, prev:null, running:true };
    setTokenPos({ x: timeline[0].x, y: timeline[0].y });
    rafRef.current = requestAnimationFrame(tick);
  }, [cancelAll, tick, prefersReduced]);

  useEffect(() => () => cancelAll(), [cancelAll]);

  return { tokenPos, flashedNode, litNodes, litEdges, animating, start };
}

// ── Inline SVG node icon (rendered inside foreignObject) ──────────────────────
function NodeIcon({ type, color }) {
  const p = { width:13, height:13, viewBox:"0 0 16 16", fill:"none", stroke:color, strokeWidth:1.5, strokeLinecap:"round", strokeLinejoin:"round", style:{ display:"block", flexShrink:0 } };
  switch(type) {
    case "ui":     return <svg {...p}><rect x="1.5" y="2.5" width="13" height="9" rx="1.5"/><path d="M5 13.5h6M8 11.5v2"/></svg>;
    case "lock":   return <svg {...p}><rect x="2.5" y="7" width="11" height="8" rx="1.5"/><path d="M5 7V5a3 3 0 016 0v2"/></svg>;
    case "shield": return <svg {...p}><path d="M8 1.5l5 2.25v4c0 3-2.2 5-5 6.25C5.2 12.75 3 10.75 3 7.75v-4L8 1.5z"/><path d="M5.5 8.5l1.5 1.5L10.5 6.5"/></svg>;
    case "check":  return <svg {...p}><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M4.5 8.5l2 2 5-5"/></svg>;
    case "branch": return <svg {...p}><circle cx="5" cy="4" r="1.5"/><circle cx="5" cy="12" r="1.5"/><circle cx="11" cy="7" r="1.5"/><path d="M5 5.5v5M5 5.5C5 8 11 8.5 11 7"/></svg>;
    case "clip":   return <svg {...p}><path d="M13 7l-5.5 5.5a3.5 3.5 0 01-4.95-4.95l5.5-5.5a2 2 0 012.83 2.83L5.5 10.2a.5.5 0 01-.71-.71L10 4.3"/></svg>;
    default: return null;
  }
}

// ── Diagram node (native SVG text — crisp at all scales) ──────────────────────
function DiagramNode({ id, litNodes, flashedNode }) {
  const n = ND[id];
  const { cx, cy, hw, hh, type, label, sub } = n;
  const isReject = type === "reject";
  const isLit    = litNodes.has(id);
  const isFlash  = flashedNode === id;

  let border = "var(--elms-line)";
  if (isReject)    border = "var(--elms-reject)";
  else if (type==="cond") border = isLit ? "var(--elms-pending)" : "var(--elms-line)";
  else if (isLit)  border = "var(--elms-primary)";
  if (isFlash)     border = "var(--elms-reject)";

  const textColor = isFlash||isReject ? "#B23B34" : isLit ? "#0B6E4F" : "#14171F";
  const rx = cx-hw, ry = cy-hh, rw = hw*2, rh = hh*2;
  // shift label up slightly when there's a subtitle
  const labelY = sub ? cy - 7 : cy;

  return (
    <g>
      {type==="db" && (
        <ellipse cx={cx} cy={ry} rx={hw} ry={9} fill="var(--elms-surface)" stroke={border} strokeWidth={1} style={{transition:"stroke 0.2s"}}/>
      )}
      <rect x={rx} y={ry} width={rw} height={rh} rx="3" fill="var(--elms-surface)" stroke={border}
        strokeWidth={isFlash ? 1.8 : 1} strokeDasharray={isReject ? "4 3" : undefined}
        style={{transition:"stroke 0.2s, stroke-width 0.15s"}}/>
      <text
        x={cx} y={labelY}
        textAnchor="middle" dominantBaseline="middle"
        fontSize="11" fontFamily={MONO} fontWeight="500"
        fill={textColor}
        style={{transition:"fill 0.2s", userSelect:"none", pointerEvents:"none"}}
      >{label}</text>
      {sub && (
        <text
          x={cx} y={cy + 9}
          textAnchor="middle" dominantBaseline="middle"
          fontSize="9" fontFamily={MONO} fontWeight="400"
          fill="#5B6270"
          style={{userSelect:"none", pointerEvents:"none"}}
        >{sub}</text>
      )}
    </g>
  );
}

// ── Edge path ─────────────────────────────────────────────────────────────────
function EdgePath({ edge, litEdges, flashedNode }) {
  const { id, d, type, label, lx, ly, la } = edge;
  const isLit      = litEdges.has(id);
  const isFlashing = flashedNode ? FLASH_EDGE_MAP[flashedNode]===id : false;

  let stroke, opacity, dash, marker;
  switch(type) {
    case "main": case "loop":
      stroke=isLit?"var(--elms-primary)":"var(--elms-line)"; opacity=1;
      dash=type==="loop"?"5 4":undefined; marker=isLit?"url(#arr-p)":"url(#arr-l)"; break;
    case "reject":
      stroke="var(--elms-reject)"; opacity=isFlashing?1:0.42; dash="5 3"; marker="url(#arr-r)"; break;
    case "cond":
      stroke="var(--elms-pending)"; opacity=isFlashing?1:0.42; dash=undefined; marker="url(#arr-c)"; break;
    default:
      stroke="var(--elms-line)"; opacity=1; dash=undefined; marker="url(#arr-l)";
  }

  return (
    <>
      <path d={d} stroke={stroke} strokeWidth="1.2" fill="none" markerEnd={marker}
        opacity={opacity} strokeDasharray={dash} style={{transition:"stroke 0.3s, opacity 0.22s"}}/>
      {label && (
        <text x={lx} y={ly} textAnchor={la} dominantBaseline="middle"
          fontSize="9" fontFamily={MONO} fill="var(--elms-ink-muted)" opacity="0.85">{label}</text>
      )}
    </>
  );
}

// ── Full SVG (natural VW×VH) — used in both compact (CSS-scaled) and expanded ─
function ArchDiagram({ litNodes, litEdges, flashedNode, tokenPos }) {
  return (
    <svg width={VW} height={VH} viewBox={`0 0 ${VW} ${VH}`}
      aria-label="ELMS request security pipeline: branching decision tree from client through JWT, role, Zod, controller, to PostgreSQL with 401/403/400 rejection branches."
      role="img" style={{display:"block", userSelect:"none"}}>
      <defs>
        {[{ id:"arr-p", fill:"#0B6E4F" },{ id:"arr-l", fill:"#E3E6EB" },{ id:"arr-r", fill:"#B23B34" },{ id:"arr-c", fill:"#C98A1E" }].map(({id,fill}) => (
          <marker key={id} id={id} markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto">
            <polygon points="0,0.5 6,3.5 0,6.5" fill={fill}/>
          </marker>
        ))}
      </defs>
      {EDGES.map(e => <EdgePath key={e.id} edge={e} litEdges={litEdges} flashedNode={flashedNode}/>)}
      {Object.keys(ND).map(id => <DiagramNode key={id} id={id} litNodes={litNodes} flashedNode={flashedNode}/>)}
      {tokenPos && (
        <circle cx={tokenPos.x} cy={tokenPos.y} r={5.5} fill="var(--elms-primary)" stroke="var(--elms-surface)" strokeWidth={2}/>
      )}
    </svg>
  );
}

// ── Icon: four-corner arrows (expand) ─────────────────────────────────────────
function ExpandIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d="M5 2H2v3M2 2l3.5 3.5M11 2h3v3M14 2l-3.5 3.5M5 14H2v-3M2 14l3.5-3.5M11 14h3v-3M14 14l-3.5-3.5"/>
    </svg>
  );
}

function CloseXIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M3 3l10 10M13 3L3 13"/>
    </svg>
  );
}

// ── Floating toolbar button ───────────────────────────────────────────────────
function TB({ onClick, title, wide, children }) {
  return (
    <button onClick={onClick} title={title}
      className={`${wide?"px-3":"w-9"} h-9 flex items-center justify-center font-mono text-[12px] font-semibold text-elms-muted hover:bg-elms-bg hover:text-elms-ink focus-ink transition-colors`}>
      {children}
    </button>
  );
}

// ── Mermaid modal ─────────────────────────────────────────────────────────────
function MermaidModal({ onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad:false, theme:"base", themeVariables:{ primaryColor:"#FFFFFF", primaryTextColor:"#14171F", primaryBorderColor:"#0B6E4F", lineColor:"#0B6E4F", nodeBorder:"#E3E6EB", mainBkg:"#FFFFFF", clusterBkg:"#F6F7F9", edgeLabelBackground:"#F6F7F9" } });
        const def = `flowchart TD
    A["Client (React + Vite)"] -->|"HTTPS + Bearer JWT"| B["Verify JWT"]
    B -->|"valid"| C["Check role"]
    B -->|"invalid/expired"| R1["401 Unauthorized"]
    C -->|"authorized"| D["Validate input (Zod)"]
    C -->|"wrong role"| R2["403 Forbidden"]
    D -->|"valid"| E["Route controller"]
    D -->|"malformed"| R3["400 Bad Request"]
    E -->|"file attached"| F["Multer"]
    E -->|"no file"| G["Parameterized query"]
    F --> G
    G --> H[("PostgreSQL")]
    H --> E
    E -->|"response"| A`;
        if (!cancelled && ref.current) {
          const { svg } = await mermaid.render("arch-mermaid-v3", def);
          ref.current.innerHTML = svg;
        }
      } catch(e) {
        if (!cancelled && ref.current) ref.current.innerHTML = `<pre style="padding:16px;font-size:11px;overflow:auto">${e.message}</pre>`;
      }
    }
    render();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const h = e => { if (e.key==="Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-elms-ink/60" onClick={onClose}/>
      <div className="relative z-10 w-full max-w-3xl rounded-lg border border-elms-line bg-elms-surface">
        <div className="flex items-center justify-between border-b border-elms-line px-5 py-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-elms-muted">Technical diagram · Mermaid</span>
          <button onClick={onClose} className="rounded p-1 text-elms-muted hover:bg-elms-bg hover:text-elms-ink focus-ink" aria-label="Close">
            <CloseXIcon/>
          </button>
        </div>
        <div ref={ref} className="overflow-auto p-6 [&>svg]:max-h-[80vh] [&>svg]:w-full">
          <p className="font-mono text-[11px] text-elms-muted">Rendering…</p>
        </div>
      </div>
    </div>
  );
}

function Badge({ label }) {
  return <span className="inline-flex items-center rounded border border-elms-line px-1.5 py-0.5 font-mono text-[10px] text-elms-muted">{label}</span>;
}

// ── Legend ────────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[10px] font-mono text-elms-muted">
      {[
        { label:"success path",    el: <span style={{display:"inline-block",width:18,height:1.5,background:"var(--elms-primary)",verticalAlign:"middle"}}/> },
        { label:"rejected (dead end)", el: <svg width="18" height="4" aria-hidden="true"><line x1="0" y1="2" x2="18" y2="2" stroke="var(--elms-reject)" strokeWidth="1.5" strokeDasharray="4 2"/></svg> },
        { label:"conditional (if file)", el: <svg width="18" height="4" aria-hidden="true"><line x1="0" y1="2" x2="18" y2="2" stroke="var(--elms-pending)" strokeWidth="1.5"/></svg> },
        { label:"response (return)", el: <svg width="18" height="4" aria-hidden="true"><line x1="0" y1="2" x2="18" y2="2" stroke="var(--elms-primary)" strokeWidth="1.5" strokeDasharray="5 3"/></svg> },
      ].map(({ label, el }) => (
        <span key={label} className="flex items-center gap-1.5">{el}{label}</span>
      ))}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function SystemArchitecture() {
  const sectionRef  = useRef(null);
  const compactRef  = useRef(null);
  const hasStarted  = useRef(false);

  const [expanded,     setExpanded]     = useState(false);
  const [showMermaid,  setShowMermaid]  = useState(false);
  const [compactScale, setCompactScale] = useState(0);   // 0 = not yet measured
  const [compactXOff,  setCompactXOff]  = useState(0);
  const [compactH,     setCompactH]     = useState("100vh"); // dynamic on mobile

  const prefersReduced =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const { tokenPos, flashedNode, litNodes, litEdges, animating, start } = useTokenAnimation(prefersReduced);

  // ── Compact view: measure container and compute CSS scale ──────────────────
  useEffect(() => {
    const el = compactRef.current;
    if (!el) return;
    const update = () => {
      const cw = el.clientWidth;
      if (!cw) return;
      // On mobile (< 640px), drive height from the SVG aspect ratio so the
      // diagram fills the box without dead space. On desktop keep 100vh.
      const isMobile = window.innerWidth < 640;
      const targetH  = isMobile ? Math.round((VH / VW) * cw) + 32 : window.innerHeight;
      const ch = targetH;
      const s    = Math.min(cw / VW, ch / VH);
      const xOff = Math.max(0, (cw - VW * s) / 2);
      setCompactH(isMobile ? targetH + "px" : "100vh");
      setCompactScale(s);
      setCompactXOff(xOff);
    };
    const ro = new ResizeObserver(update);
    ro.observe(el);
    update();
    return () => ro.disconnect();
  }, []);

  // ── Expanded view: compute initial fit scale when overlay opens ────────────
  const fitScale = useMemo(() => {
    if (typeof window === "undefined") return 0.8;
    return Math.min(window.innerWidth * 0.92 / VW, (window.innerHeight - 52) * 0.9 / VH);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  // ── Body scroll lock ───────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = expanded ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [expanded]);

  // ── ESC key to close ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!expanded) return;
    const h = e => { if (e.key==="Escape") setExpanded(false); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [expanded]);

  // ── Auto-play on scroll-into-view (once) ──────────────────────────────────
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasStarted.current) {
        hasStarted.current = true;
        start("success");
        obs.disconnect();
      }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [start]);

  const replayRejected = useCallback(() => {
    const opts = ["r401", "r403", "r400"];
    start(opts[Math.floor(Math.random() * opts.length)]);
  }, [start]);

  const diagramProps = { litNodes, litEdges, flashedNode, tokenPos };

  // ── Replay controls (reused in compact and expanded views) ─────────────────
  const ReplayButtons = ({ className="" }) => !prefersReduced ? (
    <div className={`flex flex-wrap items-center gap-x-5 gap-y-1.5 ${className}`}>
      <button onClick={() => start("success")} disabled={animating}
        className="font-mono text-[11px] text-elms-primary underline underline-offset-2 hover:opacity-75 focus-ink disabled:opacity-40 disabled:cursor-not-allowed">
        Replay: approved request
      </button>
      <button onClick={replayRejected} disabled={animating}
        className="font-mono text-[11px] underline underline-offset-2 hover:opacity-75 focus-ink disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ color:"var(--elms-reject)" }}>
        Replay: blocked request
      </button>
    </div>
  ) : null;

  return (
    <>
      {showMermaid && <MermaidModal onClose={() => setShowMermaid(false)}/>}

      {/* ════════════════════════════════════════════════════════════════════
          EXPANDED OVERLAY — fullscreen Figma-style canvas
      ════════════════════════════════════════════════════════════════════ */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background:"var(--elms-bg)" }}
          role="dialog"
          aria-modal="true"
          aria-label="System architecture — expanded pan and zoom view"
        >
          {/* Top bar */}
          <div className="flex shrink-0 items-center justify-between border-b border-elms-line bg-elms-surface px-4 py-2.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-elms-muted">
              Request flow · scroll to zoom · drag to pan · pinch on touch
            </p>
            <button
              onClick={() => setExpanded(false)}
              className="flex items-center gap-1.5 rounded border border-elms-line bg-elms-bg px-3 py-1.5 font-mono text-[11px] text-elms-muted hover:border-elms-ink hover:text-elms-ink focus-ink transition-colors"
            >
              <CloseXIcon/> Close
            </button>
          </div>

          {/* Pan / zoom canvas */}
          <div className="relative flex-1 overflow-hidden">
            <TransformWrapper
              initialScale={fitScale}
              minScale={0.1}
              maxScale={5}
              centerOnInit
              wheel={{ smoothStep: 0.0015 }}
              pinch={{ step: 5 }}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  {/* The pannable/zoomable content */}
                  <TransformComponent
                    wrapperStyle={{ width:"100%", height:"100%" }}
                    contentStyle={{ cursor:"grab" }}
                  >
                    <ArchDiagram {...diagramProps}/>
                  </TransformComponent>

                  {/* ── Floating toolbar: bottom-right ── */}
                  <div className="absolute bottom-5 right-5 z-10 flex items-center rounded border border-elms-line bg-elms-surface">
                    <TB onClick={() => zoomIn()} title="Zoom in">+</TB>
                    <div className="h-5 w-px bg-elms-line"/>
                    <TB onClick={() => zoomOut()} title="Zoom out">−</TB>
                    <div className="h-5 w-px bg-elms-line"/>
                    <TB onClick={() => resetTransform()} title="Reset to fit" wide>Fit</TB>
                  </div>

                  {/* ── Replay + Mermaid: bottom-left ── */}
                  <div className="absolute bottom-5 left-5 z-10 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <ReplayButtons/>
                    <button onClick={() => setShowMermaid(true)}
                      className="font-mono text-[11px] text-elms-muted underline underline-offset-2 hover:text-elms-ink focus-ink">
                      Mermaid diagram →
                    </button>
                  </div>
                </>
              )}
            </TransformWrapper>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          PAGE SECTION
      ════════════════════════════════════════════════════════════════════ */}
      <section id="architecture" ref={sectionRef} className="border-t border-elms-line">
        <div className="mx-auto w-full max-w-[1120px] px-6 py-16 sm:py-20">

          {/* Header */}
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-elms-muted">How Your Data Stays Safe</p>
          <h2 className="mt-5 max-w-3xl font-display text-2xl font-semibold tracking-[-0.015em] sm:text-3xl">
            Every request is checked before anything happens.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-elms-muted">
            Before any leave request is saved or updated, the system verifies who you are, whether you have permission, and whether the information is valid. If anything fails, the request is stopped immediately.
            <span className="hidden sm:inline"> Use <strong className="font-medium text-elms-ink">Expand</strong> to see the full diagram.</span>
          </p>

          {/* ── Compact auto-fit view ── */}
          <div
            ref={compactRef}
            className="relative mt-10 rounded-lg border border-elms-line"
            style={{
              height: compactH,
              overflow: "hidden",
              background: "#fafafa",
              backgroundImage: "radial-gradient(circle, #c8cdd6 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          >
            {/* Always-visible expand button — top-right corner */}
            <button
              onClick={() => setExpanded(true)}
              className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded border border-elms-line bg-elms-surface px-2.5 py-1.5 font-mono text-[10px] text-elms-muted hover:border-elms-primary hover:text-elms-primary focus-ink transition-colors"
              aria-label="Expand diagram to full screen"
            >
              <ExpandIcon/>
              <span className="hidden sm:inline">Expand</span>
            </button>

            {/* CSS-scaled diagram — invisible until measured (scale=0 guard) */}
            {compactScale > 0 && (
              <div style={{
                position:       "absolute",
                left:           compactXOff,
                top:            0,
                width:          VW,
                height:         VH,
                transform:      `scale(${compactScale})`,
                transformOrigin:"top left",
              }}>
                <ArchDiagram {...diagramProps}/>
              </div>
            )}
          </div>

          <Legend/>

          {/* Controls below compact diagram */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <ReplayButtons/>
            <button onClick={() => setShowMermaid(true)}
              className="font-mono text-[11px] text-elms-muted underline underline-offset-2 hover:text-elms-ink focus-ink sm:ml-auto">
              Technical diagram (Mermaid) →
            </button>
          </div>

          {/* Tech badges */}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { layer:"Frontend",  badges:["React","Vite","Tailwind","Axios"] },
              { layer:"Backend",   badges:["Express","JWT","bcrypt","Zod","Multer","Helmet"] },
              { layer:"Database",  badges:["PostgreSQL","Supabase"] },
            ].map(({ layer, badges }) => (
              <div key={layer} className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-elms-muted">{layer}</span>
                {badges.map(b => <Badge key={b} label={b}/>)}
              </div>
            ))}
          </div>

          {/* Captions */}
          <div className="mt-10 grid gap-6 border-t border-elms-line pt-8 sm:grid-cols-3">
            {[
              { eyebrow:"WHY THIS MATTERS",        body:"Your leave data passes through three independent checks before anything is saved. Each check only trusts what the one before it has confirmed." },
              { eyebrow:"PROTECTING YOUR RECORDS",  body:"Even if someone tried to send a fake request, the system would catch it. Identity, permission, and data format are all verified independently." },
              { eyebrow:"WHAT GETS BLOCKED",        body:"Unrecognised users, employees trying to act as managers, malformed submissions, and unsafe file types are all stopped before they can cause any harm." },
            ].map(({ eyebrow, body }) => (
              <div key={eyebrow}>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-elms-primary">{eyebrow}</p>
                <p className="mt-2 text-sm leading-relaxed text-elms-muted">{body}</p>
              </div>
            ))}
          </div>

        </div>
      </section>
    </>
  );
}
