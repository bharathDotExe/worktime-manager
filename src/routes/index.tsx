import { createFileRoute } from "@tanstack/react-router";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Check } from "lucide-react";
import { HeroCollage, StampMark } from "@/components/paper/HeroCollage";
import { InboxTray } from "@/components/paper/InboxTray";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ELMS — Leave Requests That Move as Fast as Your Team" },
      {
        name: "description",
        content:
          "An employee leave management system where ownership, roles, uploads and balances are enforced on the backend. Role-based, JWT-secured, audit-ready.",
      },
      { property: "og:title", content: "ELMS — Leave Requests That Move as Fast as Your Team" },
      {
        property: "og:description",
        content:
          "Apply, review and audit employee leave in one secure workflow. Every rule enforced server-side.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    eyebrow: "01 — INPUT",
    title: "Apply in seconds",
    body: "Pick dates, state a reason, attach a supporting document. Validation runs on the server, not just in the form.",
  },
  {
    eyebrow: "02 — REVIEW",
    title: "One-tap review",
    body: "Managers get a single pending queue and approve or reject with mandatory written remarks.",
  },
  {
    eyebrow: "03 — STORAGE",
    title: "Gated documents",
    body: "Uploads are MIME-checked, size-capped, and renamed. Files stream only to the owner or the manager.",
  },
  {
    eyebrow: "04 — ALERTS",
    title: "Exactly-once alerts",
    body: "Decisions reach the employee once — tracked in the database, never in fragile local state.",
  },
  {
    eyebrow: "05 — HISTORY",
    title: "Auditable by design",
    body: "Append-only audit rows record who decided what, when, and from where.",
  },
  {
    eyebrow: "06 — DEFAULTS",
    title: "Secure by default",
    body: "Bcrypt cost 12, short-lived JWTs, parameterized SQL, helmet, rate limits, and role checks on every route.",
  },
];

const ROTATIONS = [-2, 1.5, 3, -1, 2.5, -2.5];

const STACK = [
  "Multer",
  "Jest",
  "Helmet",
  "React",
  "Vite",
  "Express",
  "PostgreSQL",
  "JWT",
  "Bcrypt",
  "Zod",
];

const STEPS = [
  ["01", "Employee applies", "Dates, reason and a supporting document in one form."],
  ["02", "Manager reviews", "Approve or reject — remarks are compulsory."],
  ["03", "Employee is notified", "Status and remarks land in the dashboard instantly."],
];

const CHECKS = [
  "Ownership enforced with WHERE employee_id = $1",
  "Approval blocked unless remarks are provided",
  "Overlapping leave rejected by a database constraint",
];

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Landing() {
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const drift = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 90]);

  const rise = (delay: number) =>
    reduce
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.4, delay } }
      : {
          initial: { opacity: 0, y: 22 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-pencil/30 bg-paper/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <a href="#top" className="focus-paper flex items-center gap-2 rounded-[2px]">
            <span className="grid h-8 w-8 place-items-center rounded-[3px] bg-ink font-display text-[12px] text-paper">
              E
            </span>
            <span className="font-display text-lg tracking-tight">ELMS</span>
          </a>
          <nav className="flex items-center gap-1 sm:gap-4">
            {[
              ["Features", "#features"],
              ["Product", "#product"],
              ["How it works", "#how"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="focus-paper hidden rounded-[2px] px-2 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-pencil transition-colors hover:text-ink sm:inline-block"
              >
                {label}
              </a>
            ))}
            <a
              href="#product"
              className="focus-paper rounded-[3px] border-2 border-ink bg-ink px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-paper transition-transform hover:-translate-y-0.5"
            >
              Get started
            </a>
          </nav>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section id="top" ref={heroRef} className="relative overflow-hidden border-b border-pencil/30">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div>
            <motion.p
              {...rise(0)}
              className="inline-flex items-center gap-2 border-y border-pencil/50 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-pencil"
            >
              Role-based · JWT-secured · Audit-ready
            </motion.p>

            <motion.h1
              {...rise(0.08)}
              className="mt-6 max-w-[15ch] font-display text-[2.6rem] leading-[0.98] tracking-tight sm:text-6xl"
            >
              Leave requests that move as fast as your team
            </motion.h1>

            <motion.p {...rise(0.16)} className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink/75">
              An employee leave management system where ownership, roles, uploads, and balances are
              enforced on the backend. The interface is just the convenient way in.
            </motion.p>

            <motion.div {...rise(0.24)} className="mt-8 flex flex-wrap gap-3">
              <a
                href="#product"
                className="focus-paper rounded-[3px] bg-ink px-6 py-3 font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-paper shadow-[var(--shadow-paper)] transition-transform hover:-translate-y-0.5"
              >
                See the product
              </a>
              <a
                href="#how"
                className="focus-paper rounded-[3px] border-2 border-ink px-6 py-3 font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-ink transition-transform hover:-translate-y-0.5"
              >
                How it works
              </a>
            </motion.div>

            <motion.dl {...rise(0.32)} className="mt-12 flex flex-wrap gap-3">
              {[
                ["2h", "Token life"],
                ["12", "Bcrypt rounds"],
                ["100%", "Param SQL"],
                ["0", "Trusted roles"],
              ].map(([n, l], i) => (
                <div
                  key={l}
                  style={{
                    rotate: `${[-3, 2, -1.5, 3][i]}deg`,
                    clipPath:
                      "polygon(0 4%, 100% 0, 99% 96%, 60% 100%, 30% 96%, 0 100%)",
                  }}
                  className="paper-grain hover-lift bg-kraft px-4 py-2.5"
                >
                  <dt className="font-display text-lg leading-none">{n}</dt>
                  <dd className="mt-1 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.16em] text-pencil">
                    {l}
                  </dd>
                </div>
              ))}
            </motion.dl>
          </div>

          <HeroCollage scrollDrift={drift} />
        </div>
      </section>

      {/* ── Stack marquee ───────────────────────────────── */}
      <div className="overflow-hidden border-b border-pencil/30 bg-kraft/45 py-3">
        <div className="marquee-track flex w-max gap-8 whitespace-nowrap">
          {[...STACK, ...STACK].map((t, i) => (
            <span
              key={`${t}-${i}`}
              className="flex items-center gap-8 font-mono text-[11px] uppercase tracking-[0.24em] text-pencil"
            >
              {t}
              <span className="h-1 w-1 rounded-full bg-pencil/50" />
            </span>
          ))}
        </div>
      </div>

      {/* ── Features ────────────────────────────────────── */}
      <section id="features" className="border-b border-pencil/30 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal>
            <h2 className="max-w-[20ch] font-display text-3xl leading-tight tracking-tight sm:text-4xl">
              Everything the flow needs, nothing it doesn&apos;t
            </h2>
            <p className="mt-3 max-w-xl text-ink/70">
              Six guarantees the API keeps even if the browser lies to it.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 0.07}>
                <article
                  style={{ rotate: `${ROTATIONS[i]}deg` }}
                  className="paper-grain hover-lift relative h-full rounded-[3px] border border-pencil/35 bg-white p-6 pt-8 shadow-[var(--shadow-paper)]"
                >
                  <span className="absolute left-1/2 top-3 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-stamp shadow-[0_1px_3px_rgba(0,0,0,0.35)]" />
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-pencil">
                    {f.eyebrow}
                  </p>
                  <h3 className="mt-2 font-display text-lg tracking-tight">{f.title}</h3>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-ink/72">{f.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Manager / product ───────────────────────────── */}
      <section id="product" className="border-b border-pencil/30 bg-kraft/35 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 lg:grid-cols-2">
          <Reveal>
            <h2 className="max-w-[18ch] font-display text-3xl leading-tight tracking-tight sm:text-4xl">
              One queue for the manager. One truth for everyone.
            </h2>
            <p className="mt-5 max-w-xl leading-relaxed text-ink/75">
              Pending requests, balances, attached documents, and decision history sit on a single
              screen. Every row is fetched with the caller&apos;s identity baked into the SQL — there
              is no fetch-all-then-filter anywhere in the codebase.
            </p>
            <ul className="mt-7 space-y-3">
              {CHECKS.map((c) => (
                <li key={c} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-[2px] border border-approve/50 bg-approve/10">
                    <Check className="h-3 w-3 text-approve" strokeWidth={3} />
                  </span>
                  <span className="font-mono text-[12px] leading-relaxed text-ink/80">{c}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.1}>
            <InboxTray />
          </Reveal>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────── */}
      <section id="how" className="border-b border-pencil/30 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal>
            <h2 className="font-display text-3xl leading-tight tracking-tight sm:text-4xl">
              Three steps, one source of truth.
            </h2>
          </Reveal>

          <ol className="mt-14 grid gap-8 md:grid-cols-3">
            {STEPS.map(([n, title, body], i) => (
              <Reveal key={n} delay={i * 0.09}>
                <li
                  style={{ rotate: `${[-1.5, 1, -1][i]}deg` }}
                  className="paper-grain hover-lift relative h-full overflow-hidden rounded-[3px] border border-pencil/35 bg-white p-6 pl-9 shadow-[var(--shadow-paper)]"
                >
                  {/* perforated stub edge */}
                  <span
                    className="absolute left-4 top-0 h-full w-px"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(to bottom, var(--pencil) 0 5px, transparent 5px 11px)",
                      opacity: 0.6,
                    }}
                  />
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-pencil">
                    {n} — Step
                  </p>
                  <h3 className="mt-2 font-display text-lg tracking-tight">{title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-ink/72">{body}</p>

                  {i === 1 && (
                    <motion.div
                      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.8, rotate: 22 }}
                      whileInView={reduce ? { opacity: 0.95 } : { opacity: 0.95, scale: 1, rotate: -9 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={
                        reduce
                          ? { duration: 0.4 }
                          : { duration: 0.2, delay: 0.25, ease: [0.3, 1.6, 0.5, 1] }
                      }
                      className="pointer-events-none absolute -bottom-1 right-2 w-28"
                    >
                      <StampMark />
                    </motion.div>
                  )}
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section className="border-b border-pencil/30 py-20">
        <Reveal className="mx-auto max-w-3xl px-4">
          <div className="paper-grain rounded-[3px] border-2 border-ink bg-white p-8 text-center shadow-[var(--shadow-lift)] sm:p-12">
            <h2 className="font-display text-3xl tracking-tight sm:text-4xl">Ready when your team is</h2>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-ink/75">
              Spin it up in minutes, connect your own database, and start routing real requests
              through a workflow your team can trust.
            </p>
            <a
              href="#top"
              className="focus-paper mt-8 inline-block border-b-2 border-stamp pb-1 font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-stamp transition-transform hover:-translate-y-0.5"
            >
              Explore the system →
            </a>
          </div>
        </Reveal>
      </section>

      <footer className="py-8 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-pencil">
        ELMS — React · Express · PostgreSQL · JWT
      </footer>
    </div>
  );
}
