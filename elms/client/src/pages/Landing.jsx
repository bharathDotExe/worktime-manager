import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import officeHero from "../assets/office-hero.jpg";
import heroMonitorSticker from "../assets/hero-monitor-sticker.png";
import RequestTrace from "../components/trace/RequestTrace.jsx";
import SystemArchitecture from "../components/SystemArchitecture.jsx";
import AuthModal from "../components/AuthModal.jsx";
import { 
  CalendarPlus, 
  FileUp, 
  History, 
  Workflow, 
  LayoutDashboard, 
  BellRing, 
  ShieldCheck, 
  LockKeyhole,
  UserCircle,
  Briefcase,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

const NAV = [
  ["Features", "#features"],
  ["Workflow", "#workflow"],
  ["Architecture", "#architecture"],
  ["Security", "#security"],
  ["Docs", "#docs"],
];

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

const FEATURES = [
  {
    title: "Apply for Leave",
    body: "Submit leave requests with dates, reasons, and supporting documentation.",
    icon: CalendarPlus
  },
  {
    title: "Upload Documents",
    body: "Securely attach medical certificates or supporting files to requests.",
    icon: FileUp
  },
  {
    title: "Leave History",
    body: "Access a complete historical record of all past and pending requests.",
    icon: History
  },
  {
    title: "Approval Workflow",
    body: "Structured review process requiring explicit approval or rejection.",
    icon: Workflow
  },
  {
    title: "Manager Dashboard",
    body: "Centralized queue for managers to review and action employee requests.",
    icon: LayoutDashboard
  },
  {
    title: "Real-Time Notifications",
    body: "Immediate status updates delivered securely upon manager action.",
    icon: BellRing
  },
  {
    title: "Role-Based Access",
    body: "Strict separation of concerns between employees and management.",
    icon: ShieldCheck
  },
  {
    title: "Secure Authentication",
    body: "Enterprise-grade credential management and session validation.",
    icon: LockKeyhole
  }
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
    body: "The manager account is fixed and seeded once. Approvals and rejections require written remarks.",
  },
  {
    route: "GET /api/leaves/notifications",
    title: "Employee is notified.",
    body: "The next time the employee's session checks in, they see the new status exactly once, tracked server-side.",
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
  "Passwords hashed with bcrypt (cost factor 12) — never stored in plain text.",
  "Role-based authorization checks identity and permissions on every server request.",
  "Employee queries are strictly scoped (WHERE employee_id = $1) at the database level.",
  "File uploads are type-checked, size-capped, and renamed before touching the disk.",
  "Documents are served only to the owner or their manager, bypassing public folders.",
  "SQL injection protection via strictly parameterized queries.",
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

function Section({ id, children, className = "", contentClassName = "px-6 py-16 sm:py-20" }) {
  return (
    <section id={id} className={`border-t border-elms-line ${className}`}>
      <div className={`mx-auto w-full max-w-[1120px] ${contentClassName}`}>{children}</div>
    </section>
  );
}

const btnBase =
  "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-ink";
const btnPrimary = `${btnBase} bg-elms-primary text-white hover:opacity-90`;
const btnGhost = `${btnBase} border border-elms-line bg-elms-surface text-elms-ink hover:bg-elms-bg`;

export default function Landing() {
  const { user } = useAuth();
  const home = user ? (user.role === "manager" ? "/manager/requests" : "/dashboard") : "/login";
  const [authModal, setAuthModal] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <div className="min-h-screen bg-elms-bg font-sans text-elms-ink antialiased">
      {authModal && <AuthModal initialTab={authModal} onClose={() => setAuthModal(null)} />}
      
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-elms-line bg-elms-bg/95 backdrop-blur-[2px]">
        <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between px-6 py-3">
          <a href="#top" className="flex items-center gap-2 focus-ink">
            <img src="/elms_icon.png" alt="ELMS Logo" className="h-[26px] w-[26px] object-contain" />
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
            {user ? (
              <Link to={home} className={`${btnGhost} hidden sm:inline-flex`}>
                Dashboard
              </Link>
            ) : (
              <button onClick={() => setAuthModal("login")} className={`${btnGhost} hidden sm:inline-flex`}>
                Sign in
              </button>
            )}
            {user ? (
              <Link to={home} className={btnPrimary}>
                Get started
              </Link>
            ) : (
              <button onClick={() => setAuthModal("login")} className={btnPrimary}>
                Get started
              </button>
            )}
            {/* Hamburger — always on the far right on mobile */}
            <button
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={mobileNav}
              aria-controls="mobile-navigation"
              onClick={() => setMobileNav((open) => !open)}
              className="ml-1 inline-flex h-10 w-10 items-center justify-center rounded-md border border-elms-line bg-elms-surface text-elms-ink transition-colors hover:bg-elms-bg focus-ink md:hidden"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="3" y1="7" x2="21" y2="7" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="17" x2="21" y2="17" />
              </svg>
            </button>
          </div>
        </div>
        {mobileNav && (
          <nav id="mobile-navigation" aria-label="Mobile navigation" className="border-t border-elms-line bg-elms-bg px-6 py-3 md:hidden">
            <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-1">
              {NAV.map(([label, href]) => (
                <a key={label} href={href} onClick={() => setMobileNav(false)} className="rounded-md px-3 py-2 text-sm text-elms-muted hover:bg-elms-surface hover:text-elms-ink focus-ink">
                  {label}
                </a>
              ))}
              {!user && (
                <button type="button" onClick={() => { setMobileNav(false); setAuthModal("login"); }} className="mt-1 rounded-md border border-elms-line bg-elms-surface px-3 py-2 text-left text-sm font-medium text-elms-ink hover:bg-elms-bg focus-ink">
                  Sign in
                </button>
              )}
            </div>
          </nav>
        )}
      </header>

      {/* 1. Hero */}
      <main id="top">
        <section className="relative isolate overflow-hidden border-b border-elms-line">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
            {/* Background photo — visible on all screen sizes */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${officeHero})`,
                filter: "grayscale(0.55) contrast(1.12) brightness(0.86)",
              }}
            />
            {/* Ink colour-blend overlay */}
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: "var(--elms-ink)",
                mixBlendMode: "color",
                opacity: 0.12,
              }}
            />
            {/* On desktop: left-to-right gradient so text is legible over photo */}
            <div
              className="absolute inset-0 hidden sm:block"
              style={{
                background:
                  "linear-gradient(90deg, rgba(246,247,249,0.92) 0%, rgba(246,247,249,0.80) 45%, rgba(246,247,249,0.50) 65%, rgba(246,247,249,0.08) 100%)",
              }}
            />
            {/* On mobile: bottom-to-top gradient — photo shows at top, text readable at bottom */}
            <div
              className="absolute inset-0 sm:hidden"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(246,247,249,0.10) 0%, rgba(246,247,249,0.72) 45%, rgba(246,247,249,0.95) 75%, rgba(246,247,249,1.00) 100%)",
              }}
            />
          </div>

          <div className="relative z-10 mx-auto flex min-h-[85svh] sm:min-h-[calc(100vh-65px)] w-full max-w-[1120px] flex-col justify-end sm:justify-center px-6 pb-14 pt-32 sm:py-24">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-elms-muted">
              Employee Leave Management System
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-[2.4rem] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-[56px]">
              Secure Leave Management for Modern Teams
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-elms-muted">
              Employees apply for leave, attach documents, and track progress. Managers review, approve, or reject — backed by enterprise-grade security.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {user ? (
                <Link to={home} className={btnPrimary}>
                  Get started
                </Link>
              ) : (
                <button onClick={() => setAuthModal("login")} className={btnPrimary}>
                  Get started
                </button>
              )}
              <a href="#workflow" className={btnGhost}>
                Explore Workflow
              </a>
            </div>
          </div>
        </section>

        {/* Marquee */}
        <div className="overflow-hidden border-b border-elms-line bg-elms-surface py-3">
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

        {/* 2. Product Overview */}
        <Section id="overview" contentClassName="px-6 pb-16 pt-10 sm:pb-20 sm:pt-16">
          <h2 className="font-display text-2xl font-semibold tracking-[-0.015em] sm:text-3xl">
            How ELMS Works
          </h2>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-elms-muted">
            A streamlined workflow: employees submit, managers decide, everyone stays informed.
          </p>

          {/* Mobile: 2-col grid with arrows */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:hidden">
            {[
              { Icon: UserCircle, label: "Employee", accent: false },
              { Icon: FileUp, label: "Leave Request", accent: true },
              { Icon: Briefcase, label: "Manager Review", accent: false },
              { Icon: BellRing, label: "Notification", accent: true },
            ].map(({ Icon, label, accent }, i) => (
              <div key={label} className="flex flex-col items-center gap-3 rounded-lg border border-elms-line bg-elms-surface p-5">
                <div className={`h-11 w-11 rounded-full border flex items-center justify-center ${
                  accent ? "border-elms-primary/30 bg-elms-primary/5" : "border-elms-line bg-elms-bg"
                }`}>
                  <Icon className={`w-5 h-5 ${accent ? "text-elms-primary" : "text-elms-ink"}`} />
                </div>
                <span className="text-center text-[11px] font-semibold uppercase tracking-wider text-elms-muted leading-tight">{label}</span>
                <span className="font-mono text-[10px] text-elms-muted/60">Step {i + 1}</span>
              </div>
            ))}
          </div>

          {/* Desktop: horizontal flow */}
          <div className="mt-8 hidden sm:flex items-center justify-between rounded-lg border border-elms-line bg-elms-surface p-8 gap-2">
            {[
              { Icon: UserCircle, label: "Employee", accent: false },
              { Icon: FileUp, label: "Leave Request", accent: true },
              { Icon: Briefcase, label: "Manager Review", accent: false },
              { Icon: BellRing, label: "Notification", accent: true },
            ].map(({ Icon, label, accent }, i, arr) => (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center gap-3 shrink-0">
                  <div className={`h-12 w-12 rounded-full border flex items-center justify-center ${
                    accent ? "border-elms-primary/30 bg-elms-primary/5" : "border-elms-line bg-elms-bg"
                  }`}>
                    <Icon className={`w-5 h-5 ${accent ? "text-elms-primary" : "text-elms-ink"}`} />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-elms-muted">{label}</span>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-elms-line shrink-0 mx-1" />
                )}
              </React.Fragment>
            ))}
          </div>
        </Section>

        {/* 3. Core Features */}
        <Section id="features" className="bg-elms-surface">
          <h2 className="font-display text-2xl font-semibold tracking-[-0.015em] sm:text-3xl">
            Core Features
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="bg-elms-bg border border-elms-line rounded-lg p-4 sm:p-6 transition-colors hover:border-elms-primary/50">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-elms-primary mb-3" strokeWidth={1.5} />
                  <h3 className="text-xs sm:text-sm font-semibold text-elms-ink leading-tight">{feature.title}</h3>
                  <p className="mt-1.5 text-[12px] sm:text-sm leading-relaxed text-elms-muted">
                    {feature.body}
                  </p>
                </div>
              );
            })}
          </div>
        </Section>

        {/* 4. Workflow */}
        <Section id="workflow">
          <h2 className="font-display text-2xl font-semibold tracking-[-0.015em] sm:text-3xl">
            Transparent Workflow
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-elms-muted">
            The system tracks every stage of the lifecycle. Status changes are explicitly captured, and state is strictly validated at every step.
          </p>
          <div className="mt-10 rounded-lg border border-elms-line bg-elms-surface p-6 sm:p-10 shadow-sm overflow-x-auto">
            <div className="min-w-[700px]">
              <RequestTrace large />
            </div>
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

        {/* 5. System Architecture */}
        <SystemArchitecture />

        {/* 6. Security */}
        <Section id="security" className="bg-elms-surface">
          <h2 className="font-display text-2xl font-semibold tracking-[-0.015em] sm:text-3xl">
            Enterprise Security
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-elms-muted">
            Security isn't an afterthought. The system is designed with built-in protections against unauthorized access, data leaks, and malicious payloads.
          </p>
          <ul className="mt-10 grid gap-x-10 gap-y-5 md:grid-cols-2">
            {CHECKS.map((c) => (
              <li key={c} className="flex items-start gap-3">
                <Check />
                <span className="text-[14px] leading-relaxed text-elms-ink font-medium">{c}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* 7. Tech Stack (Docs) */}
        <Section id="docs">
          <h2 className="font-display text-2xl font-semibold tracking-[-0.015em] sm:text-3xl">
            Built with modern standards
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

        {/* 8. User Roles */}
        <Section className="bg-elms-surface">
          <h2 className="font-display text-2xl font-semibold tracking-[-0.015em] sm:text-3xl">
            One system, two clear roles
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            
            <div className="rounded-lg border border-elms-line bg-elms-bg p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-elms-surface border border-elms-line flex items-center justify-center">
                  <UserCircle className="w-5 h-5 text-elms-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold tracking-[-0.01em]">
                  Employee
                </h3>
              </div>
              <ul className="space-y-3">
                {[
                  "Apply for leave requests",
                  "Upload supporting medical documents",
                  "Track live status of pending requests",
                  "Receive notifications upon review",
                  "Isolated data access (can only view own records)"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-elms-muted">
                    <CheckCircle2 className="w-4 h-4 text-elms-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-elms-line bg-elms-bg p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-elms-surface border border-elms-line flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-elms-ink" />
                </div>
                <h3 className="font-display text-xl font-semibold tracking-[-0.01em]">
                  Manager
                </h3>
              </div>
              <ul className="space-y-3">
                {[
                  "Review all organizational leave requests",
                  "View and download securely attached documents",
                  "Approve or reject requests definitively",
                  "Provide required remarks and feedback",
                  "Pre-seeded account structure for security"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-elms-muted">
                    <CheckCircle2 className="w-4 h-4 text-elms-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </Section>

        {/* 9. Final CTA */}
        <Section className="relative isolate overflow-hidden">
          <div className="max-w-2xl relative z-10">
            <h2 className="font-display text-2xl font-semibold tracking-[-0.015em] sm:text-3xl">
              Start Managing Leave
            </h2>
            <p className="mt-4 text-base leading-relaxed text-elms-muted">
              Experience the complete lifecycle of an employee leave request within our secure dashboard.
            </p>
            {user ? (
              <Link
                to={home}
                className="mt-6 inline-flex items-center gap-2 rounded-md border border-elms-primary px-5 py-2.5 text-sm font-medium text-elms-primary transition-colors hover:bg-elms-primary hover:text-white focus-ink"
              >
                Launch Dashboard <span aria-hidden="true">→</span>
              </Link>
            ) : (
              <button
                onClick={() => setAuthModal("login")}
                className="mt-6 inline-flex items-center gap-2 rounded-md border border-elms-primary px-5 py-2.5 text-sm font-medium text-elms-primary transition-colors hover:bg-elms-primary hover:text-white focus-ink"
              >
                Launch Dashboard <span aria-hidden="true">→</span>
              </button>
            )}
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute right-[6%] top-1/2 z-[5] hidden w-[320px] -translate-y-1/2 lg:block xl:w-[390px] animate-float">
            <img src={heroMonitorSticker} alt="" className="w-full drop-shadow-[0_24px_28px_rgba(20,23,31,0.25)]" />
          </div>
        </Section>
      </main>

      <footer className="border-t border-elms-line bg-elms-surface">
        <div className="mx-auto w-full max-w-[1120px] px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-[11px] text-elms-muted">
            ELMS — Employee Leave Management System
          </p>
          <p className="font-mono text-[11px] text-elms-muted/70">
            React · Express · PostgreSQL · JWT
          </p>
        </div>
      </footer>
    </div>
  );
}
