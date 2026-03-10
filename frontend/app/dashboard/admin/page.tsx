import ProtectedRoute from "../../../components/ProtectedRoute";

const tasks = [
  "Review KYC submissions",
  "Approve / reject new accounts",
  "Freeze high-risk accounts",
  "Reverse failed transactions",
  "Generate compliance reports",
];

export default function AdminPage() {
  return (
    <ProtectedRoute
      title="Admin console"
      description="Privileged operations with enforced rules. Balances are never manually edited."
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task}
              className="rounded-2xl border border-ink/10 bg-sand/60 px-4 py-3 text-sm"
            >
              {task}
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-6 text-ink">
          <p className="text-xs uppercase tracking-[0.3em] text-slate">
            Risk signals
          </p>
          <p className="mt-3 text-sm text-slate">
            3 flagged accounts, 2 unusual transfers, 1 loan escalation.
          </p>
          <div className="mt-6 space-y-3 text-sm">
            {[
              "Account AB-7721 (velocity)",
              "Account AB-2190 (geo mismatch)",
              "Transfer TXN-1022 (pending)",
            ].map((signal) => (
              <div key={signal} className="rounded-xl bg-sand/60 px-3 py-2 text-slate">
                {signal}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
