import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import heroOffice from "../assets/hero-office.jpg";
import appDashboard from "../assets/app-dashboard.png";

const FEATURES = [
  {
    title: "Apply in seconds",
    body: "Pick dates, state a reason, attach a medical note or approval mail. Validation runs on the server, not just the form.",
  },
  {
    title: "One-tap review",
    body: "Managers see every pending request in one queue and approve or reject with mandatory written remarks.",
  },
  {
    title: "Gated documents",
    body: "Uploads are MIME-checked, size-capped and renamed. Files stream only to the owner or the manager — never statically served.",
  },
  {
    title: "Instant notifications",
    body: "The moment a decision lands, the employee is told once and exactly once — tracked in the database, not in local state.",
  },
  {
    title: "Auditable by design",
    body: "Every decision records who made it, when, and why. Append-only audit rows keep the history honest.",
  },
  {
    title: "Secure by default",
    body: "bcrypt (cost 12), short-lived JWTs, parameterized SQL, helmet, per-IP rate limits and role checks on every route.",
  },
];

const STEPS = [
  ["01", "Employee applies", "Dates, reason and a supporting document."],
  ["02", "Manager reviews", "Approve or reject — remarks are compulsory."],
  ["03", "Employee is notified", "Status and remarks arrive in the dashboard."],
];

export default function Landing() {
  const { user } = useAuth();
  const home = user ? (user.role === "manager" ? "/manager/requests" : "/dashboard") : "/login";

  return (
    <div className="min-h-screen overflow-hidden bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <span className="text-lg font-bold tracking-tight text-accent-600">ELMS</span>
          <nav className="flex items-center gap-2">
            <Link to="/login" className="btn-ghost">Sign in</Link>
            <Link to="/register" className="btn-primary">Get started</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroOffice}
            alt="Bright modern office workspace"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/55 via-white/45 to-white" />
          <div className="pointer-events-none absolute inset-0">
            <div className="animate-blob absolute -left-24 top-[-6rem] h-72 w-72 rounded-full bg-accent-100 blur-3xl" />
            <div className="animate-blob-slow absolute right-[-6rem] top-24 h-80 w-80 rounded-full bg-sky-100 blur-3xl" />
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-24 text-center">

          <span className="animate-rise inline-flex items-center gap-2 rounded-full border border-accent-100 bg-accent-50 px-3 py-1 text-xs font-medium text-accent-700">
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-accent-500" />
            Role-based · JWT secured · Audit-ready
          </span>

          <h1 className="animate-rise animate-delay-1 mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-6xl">
            Leave requests that move{" "}
            <span className="bg-gradient-to-r from-accent-500 to-sky-500 bg-clip-text text-transparent">
              as fast as your team
            </span>
          </h1>

          <p className="animate-rise animate-delay-2 mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            An Employee Leave Management System where every rule — ownership, roles, uploads,
            balances — is enforced on the backend. The UI is just the convenient way in.
          </p>

          <div className="animate-rise animate-delay-3 mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to={home} className="btn-primary hover-lift px-6 py-3 text-base">
              {user ? "Go to dashboard" : "Sign in"}
            </Link>
            <Link to="/register" className="btn-ghost hover-lift px-6 py-3 text-base">
              Create employee account
            </Link>
          </div>

          <dl className="animate-rise animate-delay-4 mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["2h", "Token lifetime"],
              ["12", "bcrypt rounds"],
              ["100%", "Parameterized SQL"],
              ["0", "Client-trusted roles"],
            ].map(([n, l]) => (
              <div key={l} className="card hover-lift py-5">
                <dt className="text-2xl font-bold text-slate-900">{n}</dt>
                <dd className="mt-1 text-xs uppercase tracking-wide text-slate-500">{l}</dd>
              </div>
            ))}
          </dl>

          <img
            src={appDashboard}
            alt="ELMS dashboard showing leave requests, statuses and balances"
            loading="lazy"
            className="animate-rise animate-delay-4 animate-float mx-auto mt-16 w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl"
          />
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-200 bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
            Everything the flow needs, nothing it doesn&apos;t
          </h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <article
                key={f.title}
                className={`card hover-lift animate-rise animate-delay-${(i % 4) + 1}`}
              >
                <h3 className="text-base font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
            Three steps, one source of truth
          </h2>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map(([n, title, body], i) => (
              <li key={n} className={`card hover-lift animate-rise animate-delay-${i + 1}`}>
                <span className="text-sm font-bold text-accent-500">{n}</span>
                <h3 className="mt-2 font-semibold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm text-slate-600">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-accent-600 to-sky-600 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">Ready when your team is</h2>
          <p className="mt-3 text-accent-50">
            Sign in as a manager to review the queue, or register as an employee and file your
            first request.
          </p>
          <Link
            to="/login"
            className="btn hover-lift mt-7 bg-white px-6 py-3 text-base font-semibold text-accent-700 hover:bg-accent-50"
          >
            Sign in to ELMS
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        ELMS — Employee Leave Management System · React · Express · PostgreSQL · JWT
      </footer>
    </div>
  );
}
