import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ELMS — Employee Leave Management System" },
      {
        name: "description",
        content:
          "Apply, review and audit employee leave in one secure workflow. Role-based access, JWT auth and every rule enforced on the backend.",
      },
      { property: "og:title", content: "ELMS — Employee Leave Management System" },
      {
        property: "og:description",
        content:
          "Apply, review and audit employee leave in one secure workflow. Role-based access, JWT auth and backend-enforced rules.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  ["Apply in seconds", "Pick dates, state a reason, attach a supporting document. Validation runs on the server, not just the form."],
  ["One-tap review", "Managers see every pending request in one queue and approve or reject with mandatory written remarks."],
  ["Gated documents", "Uploads are MIME-checked, size-capped and renamed. Files stream only to the owner or the manager."],
  ["Exactly-once notifications", "Decisions reach the employee once, tracked in the database rather than in local state."],
  ["Auditable by design", "Append-only audit rows record who decided what, when, and why."],
  ["Secure by default", "bcrypt cost 12, short-lived JWTs, parameterized SQL, helmet, rate limits and role checks everywhere."],
];

const STEPS: [string, string, string][] = [
  ["01", "Employee applies", "Dates, reason and a supporting document."],
  ["02", "Manager reviews", "Approve or reject — remarks are compulsory."],
  ["03", "Employee is notified", "Status and remarks land in the dashboard."],
];

function Landing() {
  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <span className="text-lg font-bold tracking-tight text-brand">ELMS</span>
          <nav className="flex items-center gap-4 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground">Features</a>
            <a href="#how" className="text-muted-foreground hover:text-foreground">How it works</a>
            <a
              href="#cta"
              className="rounded-md bg-brand px-4 py-2 font-medium text-brand-foreground hover-lift"
            >
              Get started
            </a>
          </nav>
        </div>
      </header>

      <section className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="animate-blob absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-soft blur-3xl" />
          <div className="animate-blob-slow absolute -right-24 top-24 h-80 w-80 rounded-full bg-brand-soft blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-20 pt-24 text-center">
          <span className="animate-rise inline-flex items-center gap-2 rounded-full border border-border bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-brand" />
            Role-based · JWT secured · Audit-ready
          </span>

          <h1 className="animate-rise delay-1 mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Leave requests that move{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-brand)" }}
            >
              as fast as your team
            </span>
          </h1>

          <p className="animate-rise delay-2 mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            An Employee Leave Management System where ownership, roles, uploads and balances are
            all enforced on the backend. The interface is just the convenient way in.
          </p>

          <dl className="animate-rise delay-4 mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[["2h", "Token lifetime"], ["12", "bcrypt rounds"], ["100%", "Parameterized SQL"], ["0", "Client-trusted roles"]].map(
              ([n, l]) => (
                <div key={l} className="hover-lift rounded-xl border border-border bg-card p-5">
                  <dt className="text-2xl font-bold">{n}</dt>
                  <dd className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{l}</dd>
                </div>
              ),
            )}
          </dl>
        </div>
      </section>

      <section id="features" className="border-t border-border bg-muted/40 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Everything the flow needs, nothing it doesn&apos;t
          </h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(([title, body], i) => (
              <article
                key={title}
                className={`hover-lift animate-rise delay-${(i % 4) + 1} rounded-xl border border-border bg-card p-6`}
              >
                <h3 className="text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Three steps, one source of truth
          </h2>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map(([n, title, body], i) => (
              <li
                key={n}
                className={`hover-lift animate-rise delay-${i + 1} rounded-xl border border-border bg-card p-6`}
              >
                <span className="text-sm font-bold text-brand">{n}</span>
                <h3 className="mt-2 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="cta" className="py-16" style={{ background: "var(--gradient-brand)" }}>
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-brand-foreground">Ready when your team is</h2>
          <p className="mt-3 text-brand-foreground/80">
            Run the ELMS monorepo locally: an Express API, a PostgreSQL schema and a React client
            that never decides anything the server hasn&apos;t already approved.
          </p>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        ELMS — React · Express · PostgreSQL · JWT
      </footer>
    </div>
  );
}
