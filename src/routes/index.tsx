import { createFileRoute } from "@tanstack/react-router";
import RequestTrace from "@/components/trace/RequestTrace";
import officeHero from "@/assets/office-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ELMS — Leave requests, enforced end to end" },
      {
        name: "description",
        content:
          "ELMS is an employee leave management system where roles, uploads and balances are enforced by the backend. See the full request lifecycle and security model.",
      },
      { property: "og:title", content: "ELMS — Leave requests, enforced end to end" },
      {
        property: "og:description",
        content:
          "Role-based access, JWT auth, parameterized SQL and audit logging — the request lifecycle, explained end to end.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const NAV = [
  ["Product", "#product"],
  ["Security", "#security"],
  ["Workflow", "#workflow"],
  ["Docs", "#docs"],
] as const;

const STATS = ["2h token expiry", "bcrypt cost 12", "100% parameterized SQL", "2 trusted roles"];

const STACK = [
  "React",
  "Vite",
  "Express",
  "Node.js",
  "PostgreSQL",
  "JWT",
  "Bcrypt",
  "Multer",
  "Zod",
  "Helmet",
];

const STEPS = [
  {
    route: "POST /api/leaves",
    title: "Employee applies.",
    body: "Reason, start date, end date, and an optional file are validated on the server before anything is saved — never trusted from the form alone.",
  },
  {
    route: "PATCH /api/leaves/:id",
    title: "Manager reviews.",
    body: "The manager account is fixed and seeded once — there is no path in the product that creates a second one. Approvals and rejections require written remarks.",
  },
  {
    route: "GET /api/leaves/notifications",
    title: "Employee is notified.",
    body: "The next time the employee's session checks in, they see the new status exactly once, tracked server-side — never re-shown on refresh.",
  },
];

const BUILT_WITH = [
  ["Frontend", "React + Vite + Tailwind", "Fast to build, easy to keep consistent."],
  ["Backend", "Node.js + Express", "A small, explicit API surface, easy to reason about."],
  [
    "Database",
    "PostgreSQL",
    "Relational integrity for a workflow that can't afford half-saved state.",
  ],
  [
    "Security",
    "JWT, bcrypt, Helmet, Zod",
    "Authentication, password hashing, safe headers, and input validation, each doing one job.",
  ],
];

const CHECKS = [
  "Passwords hashed with bcrypt, cost factor 12 — never stored in plain text",
  "Every manager-only route checks both identity and role, on the server, every time",
  "Every employee query is scoped with WHERE employee_id = $1 — never filtered client-side",
  "All file uploads are type-checked, size-capped, and renamed before they touch disk",
  "Uploaded files are served only to their owner or the manager — never from a public folder",
  "Every SQL statement is parameterized — no string concatenation, ever",
];

function Check() {
  return (
    <svg viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true">
      <path
        d="M3 8.5l3.2 3.2L13 5"
        fill="none"
        stroke="var(--elms-primary)"
        strokeWidth="1.6"
        strokeLinecap="square"
      />
    </svg>
  );
}

function Section({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`border-t border-elms-line ${className}`}>
      <div className="mx-auto w-full max-w-[1120px] px-6 py-16 sm:py-20">{children}</div>
    </section>
  );
}

const btnBase =
  "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-ink";
const btnPrimary = `${btnBase} bg-elms-primary text-white hover:opacity-90`;
const btnGhost = `${btnBase} border border-elms-line bg-elms-surface text-elms-ink hover:bg-elms-bg`;

function Home() {
  return (
    <div className="min-h-screen bg-elms-bg font-sans text-elms-ink antialiased">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-elms-line bg-elms-bg/95 backdrop-blur-[2px]">
        <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between px-6 py-3">
          <a href="#top" className="flex items-center gap-2 focus-ink">
            <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
              <rect
                x="2.5"
                y="7.5"
                width="15"
                height="10"
                rx="1.5"
                fill="none"
                stroke="var(--elms-primary)"
                strokeWidth="1.5"
              />
              <path
                d="M6.5 7.5V5.5a3.5 3.5 0 017 0v2"
                fill="none"
                stroke="var(--elms-primary)"
                strokeWidth="1.5"
              />
            </svg>
            <span className="font-mono text-sm font-semibold tracking-tight">ELMS</span>
          </a>
          <nav className="hidden items-center gap-7 md:flex">
            {NAV.map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="text-sm text-elms-muted transition-colors hover:text-elms-ink focus-ink"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <a href="#docs" className={`${btnGhost} hidden sm:inline-flex`}>
              View source
            </a>
            <a href="#workflow" className={btnPrimary}>
              Get started
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main id="top">
        <section className="relative isolate overflow-hidden border-b border-elms-line">
          {/* Static photographic backdrop, duotone-graded into the palette */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
            <div
              className="hidden h-full w-full bg-cover bg-center sm:block"
              style={{
                backgroundImage: `url(${officeHero})`,
                filter: "grayscale(0.78) contrast(1.05) brightness(1.02)",
              }}
            />
            <div
              className="hidden h-full w-full sm:block"
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "var(--elms-ink)",
                mixBlendMode: "color",
                opacity: 0.25,
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, color-mix(in oklab, var(--elms-bg) 92%, transparent) 0%, color-mix(in oklab, var(--elms-bg) 86%, transparent) 45%, color-mix(in oklab, var(--elms-bg) 40%, transparent) 100%)",
              }}
            />
            {/* Small screens: solid fallback for guaranteed contrast */}
            <div className="absolute inset-0 bg-elms-bg sm:hidden" />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-[1120px] px-6 pb-16 pt-16 sm:pt-24">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-elms-muted">
            Role-based access · JWT auth · Audit-logged
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-[1.08] tracking-[-0.02em] sm:text-[56px]">
            Leave requests, enforced end to end
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-elms-muted">
            ELMS is an employee leave management system where every rule — who can approve, who can
            see a file, who counts as a manager — is enforced by the backend, not the interface.
            Here's exactly how a request moves through it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#workflow" className={btnPrimary}>
              See how it works
            </a>
            <a href="#security" className={btnGhost}>
              Read the security model
            </a>
          </div>

          <div className="mt-14 rounded-lg border border-elms-line bg-elms-surface p-6 sm:p-8">
            <RequestTrace />
          </div>

          <div className="mt-6 flex flex-wrap items-center font-mono text-[11px] text-elms-muted">
            {STATS.map((s, i) => (
              <span
                key={s}
                className={`py-1 pr-4 ${i > 0 ? "border-l border-elms-line pl-4" : ""}`}
              >
                {s}
              </span>
            ))}
          </div>
          </div>
        </section>

        {/* Marquee */}
        <div className="overflow-hidden border-y border-elms-line bg-elms-surface py-3">
          <div className="marquee-track flex w-max">
            {[0, 1].map((dup) => (
              <ul
                key={dup}
                className="flex shrink-0 items-center"
                aria-hidden={dup === 1 || undefined}
              >
                {STACK.map((t) => (
                  <li
                    key={t}
                    className="px-6 font-mono text-[11px] uppercase tracking-[0.18em] text-elms-muted/80"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        {/* What this is */}
        <Section id="product">
          <div className="grid gap-10 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
            <h2 className="font-display text-2xl font-semibold tracking-[-0.015em] sm:text-3xl">
              What ELMS actually does
            </h2>
            <p className="max-w-2xl text-base leading-relaxed text-elms-muted">
              Employees apply for leave with a reason, a date range, and a supporting document.
              Managers see every request in one queue, open the attached file, and approve or reject
              it with a required comment. Status changes reach the employee once, and only once.
              That's the whole product — the rest of this page is about how it stays correct and
              secure while doing it.
            </p>
          </div>
        </Section>

        {/* Workflow */}
        <Section id="workflow" className="bg-elms-surface">
          <h2 className="font-display text-2xl font-semibold tracking-[-0.015em] sm:text-3xl">
            Three steps, no shortcuts
          </h2>
          <div className="mt-10 rounded-lg border border-elms-line bg-elms-bg p-6 sm:p-10">
            <RequestTrace large />
          </div>
          <ol className="mt-10 grid gap-px overflow-hidden rounded-lg border border-elms-line bg-elms-line md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.route} className="bg-elms-surface p-6">
                <p className="font-mono text-[11px] text-elms-primary">{s.route}</p>
                <h3 className="mt-3 text-sm font-semibold">
                  <span className="mr-2 font-mono text-elms-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-elms-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </Section>

        {/* Built with */}
        <Section id="docs">
          <h2 className="font-display text-2xl font-semibold tracking-[-0.015em] sm:text-3xl">
            Built with
          </h2>
          <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-elms-line bg-elms-line sm:grid-cols-2 lg:grid-cols-4">
            {BUILT_WITH.map(([kind, stack, why]) => (
              <div key={kind} className="bg-elms-surface p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-elms-muted">
                  {kind}
                </p>
                <h3 className="mt-3 text-sm font-semibold">{stack}</h3>
                <p className="mt-2 text-sm leading-relaxed text-elms-muted">{why}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Security */}
        <Section id="security" className="bg-elms-surface">
          <h2 className="font-display text-2xl font-semibold tracking-[-0.015em] sm:text-3xl">
            Nothing here is optional
          </h2>
          <ul className="mt-10 grid gap-x-10 gap-y-4 md:grid-cols-2">
            {CHECKS.map((c) => (
              <li key={c} className="flex items-start gap-3">
                <Check />
                <span className="font-mono text-[13px] leading-relaxed text-elms-ink">{c}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* Two roles */}
        <Section>
          <h2 className="font-display text-2xl font-semibold tracking-[-0.015em] sm:text-3xl">
            One system, two clear roles
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {[
              [
                "Employee",
                "Apply for leave, attach a document, track status, get notified once. Can only ever see their own requests.",
              ],
              [
                "Manager",
                "One fixed account, seeded once. Review every request, open attached documents, approve or reject with a comment.",
              ],
            ].map(([role, body]) => (
              <div key={role} className="rounded-lg border border-elms-line bg-elms-surface p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-elms-muted">
                  Role
                </p>
                <h3 className="mt-3 font-display text-lg font-semibold tracking-[-0.01em]">
                  {role}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-elms-muted">{body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* CTA */}
        <Section className="bg-elms-surface">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-semibold tracking-[-0.015em] sm:text-3xl">
              See the whole flow
            </h2>
            <p className="mt-4 text-base leading-relaxed text-elms-muted">
              Walk through a real leave request, from submission to approval, in about two minutes.
            </p>
            <a
              href="#workflow"
              className="mt-6 inline-flex items-center gap-2 rounded-md border border-elms-primary px-4 py-2 text-sm font-medium text-elms-primary transition-colors hover:bg-elms-primary hover:text-white focus-ink"
            >
              Explore the system <span aria-hidden="true">→</span>
            </a>
          </div>
        </Section>
      </main>

      <footer className="border-t border-elms-line">
        <div className="mx-auto w-full max-w-[1120px] px-6 py-8">
          <p className="font-mono text-[11px] text-elms-muted">
            ELMS — React · Express · PostgreSQL · JWT
          </p>
        </div>
      </footer>
    </div>
  );
}
