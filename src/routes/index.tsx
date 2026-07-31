import { createFileRoute } from "@tanstack/react-router";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import {
  ArrowRight,
  CalendarCheck,
  FileLock2,
  BellRing,
  ScrollText,
  ShieldCheck,
  Zap,
} from "lucide-react";
import heroOffice from "@/assets/hero-office.jpg";
import appDashboard from "@/assets/app-dashboard.png";

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
  {
    icon: CalendarCheck,
    title: "Apply in seconds",
    body: "Pick dates, state a reason, attach a supporting document. Validation runs on the server, not just in the form.",
  },
  {
    icon: Zap,
    title: "One-tap review",
    body: "Managers get a single pending queue and approve or reject with mandatory written remarks.",
  },
  {
    icon: FileLock2,
    title: "Gated documents",
    body: "Uploads are MIME-checked, size-capped and renamed. Files stream only to the owner or the manager.",
  },
  {
    icon: BellRing,
    title: "Exactly-once alerts",
    body: "Decisions reach the employee once — tracked in the database, never in fragile local state.",
  },
  {
    icon: ScrollText,
    title: "Auditable by design",
    body: "Append-only audit rows record who decided what, when, and from where.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by default",
    body: "bcrypt cost 12, short-lived JWTs, parameterized SQL, helmet, rate limits and role checks on every route.",
  },
];

const STEPS: [string, string, string][] = [
  ["01", "Employee applies", "Dates, reason and a supporting document in one form."],
  ["02", "Manager reviews", "Approve or reject — remarks are compulsory."],
  ["03", "Employee is notified", "Status and remarks land in the dashboard instantly."],
];

const STACK = [
  "React",
  "Vite",
  "Express",
  "PostgreSQL",
  "JWT",
  "bcrypt",
  "Zod",
  "Multer",
  "Jest",
  "Helmet",
];

function Landing() {
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "18%"]);
  const heroFade = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 0.35]);

  const rise = (delay = 0) => ({
    initial: reduce ? {} : { opacity: 0, y: 26 },
    whileInView: reduce ? {} : { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <motion.header
        initial={reduce ? {} : { y: -60, opacity: 0 }}
        animate={reduce ? {} : { y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-0 top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-foreground">
              <CalendarCheck className="h-4 w-4" />
            </span>
            ELMS
          </span>
          <nav className="hidden items-center gap-6 text-sm sm:flex">
            <a href="#features" className="text-muted-foreground transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#preview" className="text-muted-foreground transition-colors hover:text-foreground">
              Product
            </a>
            <a href="#how" className="text-muted-foreground transition-colors hover:text-foreground">
              How it works
            </a>
          </nav>
          <a
            href="#cta"
            className="group inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-transform hover:scale-[1.03]"
          >
            Get started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </motion.header>

      {/* Hero */}
      <section ref={heroRef} className="relative isolate min-h-[92vh] overflow-hidden">
        <motion.div style={{ y: heroY, opacity: heroFade }} className="absolute inset-0 -z-20">
          <img
            src={heroOffice}
            alt="Bright modern office workspace with daylight through tall windows"
            width={1920}
            height={1280}
            className="h-[115%] w-full object-cover"
          />
        </motion.div>
        {/* Lighter wash so the photo stays visible behind the copy */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/55 via-background/45 to-background" />
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="animate-blob absolute -left-32 top-10 h-96 w-96 rounded-full bg-brand-soft/40 blur-3xl" />
          <div className="animate-blob-slow absolute -right-32 top-40 h-[26rem] w-[26rem] rounded-full bg-brand-glow/10 blur-3xl" />
        </div>


        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-24 pt-36 lg:grid-cols-[1.05fr_1fr]">
          <div className="text-center lg:text-left">
            <motion.span
              {...rise(0)}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-brand backdrop-blur"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
              </span>
              Role-based · JWT secured · Audit-ready
            </motion.span>

            <motion.h1
              {...rise(0.08)}
              className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl"
            >
              Leave requests that move{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "var(--gradient-brand)" }}
              >
                as fast as your team
              </span>
            </motion.h1>

            <motion.p
              {...rise(0.16)}
              className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground lg:mx-0"
            >
              An Employee Leave Management System where ownership, roles, uploads and balances are
              enforced on the backend. The interface is just the convenient way in.
            </motion.p>

            <motion.div
              {...rise(0.24)}
              className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
            >
              <a
                href="#preview"
                className="group inline-flex items-center gap-2 rounded-full px-6 py-3 text-base font-semibold text-brand-foreground shadow-[var(--shadow-elegant)] transition-transform hover:scale-[1.03]"
                style={{ background: "var(--gradient-brand)" }}
              >
                See the product
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#how"
                className="rounded-full border border-border bg-card/70 px-6 py-3 text-base font-semibold backdrop-blur transition-colors hover:bg-muted"
              >
                How it works
              </a>
            </motion.div>

            
            <motion.dl
              {...rise(0.32)}
              className="mt-14 grid max-w-lg grid-cols-2 items-stretch gap-3 sm:grid-cols-4 sm:gap-4"
            >
              {[
                ["2h", "Token life"],
                ["12", "bcrypt rounds"],
                ["100%", "Param. SQL"],
                ["0", "Trusted roles"],
              ].map(([n, l]) => (
                <div
                  key={l}
                  className="hover-lift flex h-full min-h-[92px] flex-col justify-center rounded-xl border border-border bg-card/85 p-4 shadow-sm backdrop-blur-md"
                >
                  <dt className="text-2xl font-bold">{n}</dt>
                  <dd className="mt-1 whitespace-nowrap text-[11px] uppercase tracking-wide text-muted-foreground">
                    {l}
                  </dd>
                </div>
              ))}
            </motion.dl>
          </div>


          {/* Floating product shot */}
          <motion.div
            initial={reduce ? {} : { opacity: 0, y: 40, rotateX: 12 }}
            animate={reduce ? {} : { opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <motion.div
              animate={reduce ? {} : { y: [0, -14, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-[0_40px_80px_-40px_rgba(15,23,42,0.55)]"
            >
              <img
                src={appDashboard}
                alt="ELMS manager dashboard showing leave requests with approved and pending statuses"
                width={1536}
                height={1024}
                loading="lazy"
                className="w-full rounded-xl"
              />
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* Stack marquee */}
      <section className="overflow-hidden border-y border-border bg-muted/40 py-5">
        <motion.div
          className="flex w-max gap-10 whitespace-nowrap text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground"
          animate={reduce ? {} : { x: ["0%", "-50%"] }}
          transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
        >
          {[...STACK, ...STACK].map((s, i) => (
            <span key={`${s}-${i}`} className="flex items-center gap-10">
              {s}
              <span className="h-1 w-1 rounded-full bg-brand/60" />
            </span>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-6xl px-4">
          <motion.h2 {...rise(0)} className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Everything the flow needs, nothing it doesn&apos;t
          </motion.h2>
          <motion.p {...rise(0.06)} className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Six guarantees the API keeps even if the browser lies to it.
          </motion.p>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.article
                key={f.title}
                {...rise(0.05 * (i % 3))}
                whileHover={reduce ? {} : { y: -6 }}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-[var(--shadow-elegant)]"
              >
                <div
                  className="absolute inset-x-0 -top-px h-px opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ background: "var(--gradient-brand)" }}
                />
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Product preview */}
      <section id="preview" className="border-y border-border bg-muted/40 py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-2">
          <motion.div {...rise(0)}>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              One queue for the manager. One truth for everyone.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Pending requests, balances, attached documents and decision history sit on a single
              screen. Every row is fetched with the caller&apos;s identity baked into the SQL — there
              is no fetch-all-then-filter anywhere in the codebase.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Ownership enforced with WHERE employee_id = $1",
                "Approval blocked unless remarks are provided",
                "Overlapping leave rejected by a database constraint",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span className="text-muted-foreground">{t}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.img
            {...rise(0.1)}
            src={appDashboard}
            alt="Leave requests table with status pills, leave balance widget and calendar"
            width={1536}
            height={1024}
            loading="lazy"
            className="w-full rounded-2xl border border-border shadow-[0_30px_60px_-35px_rgba(15,23,42,0.5)]"
          />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24">
        <div className="mx-auto max-w-5xl px-4">
          <motion.h2 {...rise(0)} className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Three steps, one source of truth
          </motion.h2>
          <ol className="mt-14 grid gap-6 md:grid-cols-3">
            {STEPS.map(([n, title, body], i) => (
              <motion.li
                key={n}
                {...rise(0.08 * i)}
                whileHover={reduce ? {} : { y: -6 }}
                className="relative rounded-2xl border border-border bg-card p-6"
              >
                <span
                  className="text-sm font-bold text-transparent"
                  style={{ backgroundImage: "var(--gradient-brand)", backgroundClip: "text" }}
                >
                  {n}
                </span>
                <h3 className="mt-2 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="relative overflow-hidden py-20">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-brand)" }} />
        <motion.div
          {...rise(0)}
          className="mx-auto max-w-3xl px-4 text-center text-brand-foreground"
        >
          <h2 className="text-3xl font-bold sm:text-4xl">Ready when your team is</h2>
          <p className="mt-4 opacity-85">
            Run the ELMS monorepo locally: an Express API, a hardened PostgreSQL schema and a React
            client that never decides anything the server hasn&apos;t already approved.
          </p>
          <a
            href="#features"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-background px-6 py-3 text-base font-semibold text-foreground transition-transform hover:scale-[1.03]"
          >
            Explore the system
            <ArrowRight className="h-4 w-4" />
          </a>
        </motion.div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        ELMS — React · Express · PostgreSQL · JWT
      </footer>
    </div>
  );
}
