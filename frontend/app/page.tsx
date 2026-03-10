import Link from "next/link";
import Navbar from "../components/Navbar";

const features = [
  {
    title: "Onboarding pipeline",
    body: "Register, upload KYC, and wait for admin verification. Accounts stay PENDING until approved.",
  },
  {
    title: "Secure authentication",
    body: "Role-checked sessions, hashed credentials, and rate-limited requests with audit trails.",
  },
  {
    title: "Atomic transfers",
    body: "Funds move with balance locks and rollback on failure for absolute consistency.",
  },
];

const roles = [
  {
    title: "Customer",
    body: "Deposits, withdrawals, transfers, loans, and immutable transaction history.",
  },
  {
    title: "Bank System",
    body: "Account validation, interest rules, limits, audit logs, and security policy enforcement.",
  },
  {
    title: "Admin",
    body: "KYC verification, account freezing, report generation, and suspicious activity review.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="grain bg-white text-ink">
        <Navbar />
        <div className="section grid gap-12 pb-24 pt-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate">
              Trust-first banking OS
            </p>
            <h1 className="mt-4 font-display text-5xl leading-tight md:text-6xl">
              Bank management designed for auditability, safety, and clarity.
            </h1>
            <p className="mt-6 text-lg text-slate">
              Every account, transaction, and loan is tracked with immutable logs,
              role-based rules, and hardened access paths. Ready for modern
              operations.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/register"
                className="rounded-full bg-brass px-6 py-3 text-sm text-ink"
              >
                Start onboarding
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-ink/20 px-6 py-3 text-sm text-ink"
              >
                View dashboard
              </Link>
            </div>
          </div>
          <div className="space-y-4">
            {features.map((feature) => (
              <div key={feature.title} className="glass rounded-3xl p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-slate">
                  {feature.title}
                </p>
                <p className="mt-3 text-sm text-ink/80">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <section id="product" className="section py-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate">
              Lifecycle
            </p>
            <h2 className="mt-3 font-display text-4xl">
              From onboarding to loan servicing — fully orchestrated.
            </h2>
            <p className="mt-4 text-sm text-slate">
              Every action is validated, logged, and surfaced in a clear workflow so
              customers and staff know exactly where money sits and who can touch
              it.
            </p>
          </div>
          <div className="grid gap-4">
            {[
              "Account creation → PENDING",
              "Admin verification → ACTIVE",
              "Deposit & withdraw with limits",
              "Atomic fund transfers",
              "Loan management with approvals",
              "Immutable transaction history",
            ].map((step) => (
              <div
                key={step}
                className="rounded-2xl border border-ink/10 bg-white p-4"
              >
                <p className="text-sm">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="security" className="section pb-16">
        <div className="rounded-3xl bg-white p-10 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate">
                Always-on security
              </p>
              <h2 className="mt-3 font-display text-4xl">
                Security runs in the background, always.
              </h2>
            </div>
            <div className="max-w-xl text-sm text-slate">
              Password hashing, token validation, role-based access, rate limiting,
              audit logs, and session expiry are enforced across every workflow.
            </div>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "Password hashing + MFA ready",
              "JWT and session rotation",
              "Audit log retention policies",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-ink/10 bg-sand/70 p-4 text-sm"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="roles" className="section pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {roles.map((role) => (
            <div key={role.title} className="rounded-3xl bg-white p-6 shadow-card">
              <p className="text-xs uppercase tracking-[0.3em] text-slate">
                {role.title}
              </p>
              <p className="mt-4 text-sm text-slate">{role.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="ops" className="section pb-20">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-3xl border border-ink/10 bg-white p-8 text-ink">
            <p className="text-xs uppercase tracking-[0.3em] text-slate">
              Admin operations
            </p>
            <h3 className="mt-3 font-display text-3xl">
              Control without manual balance edits.
            </h3>
            <ul className="mt-6 space-y-3 text-sm text-slate">
              {[
                "Freeze accounts instantly",
                "Reverse failed transactions only",
                "Review suspicious activity",
                "Generate audit-ready reports",
              ].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-ink/10 bg-white p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-slate">
              Golden rule
            </p>
            <p className="mt-4 text-2xl font-display">
              Admins never edit balances manually.
            </p>
            <p className="mt-4 text-sm text-slate">
              Trust in the ledger is preserved by enforcing operations through
              validated transactions only.
            </p>
            <Link
              href="/dashboard/admin"
              className="mt-6 inline-flex rounded-full bg-brass px-5 py-3 text-sm text-ink"
            >
              Visit admin console
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
