type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
};

export default function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-card">
      <p className="text-xs uppercase tracking-[0.3em] text-slate">{label}</p> 
      <p className="mt-4 font-display text-3xl">{value}</p>
      {hint ? <p className="mt-3 text-sm text-slate">{hint}</p> : null}
    </div>
  );
}
