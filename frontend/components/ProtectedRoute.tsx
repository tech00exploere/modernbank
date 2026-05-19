type ProtectedRouteProps = {
  title: string;
  description: string;
  children: React.ReactNode;
}; 

export default function ProtectedRoute({
  title,
  description,
  children,
}: ProtectedRouteProps) { 
  return (
    <section className="rounded-3xl border border-ink/10 bg-white p-6 shadow-card">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-slate">Secure</p>
        <p className="font-display text-2xl">{title}</p>
        <p className="mt-2 text-sm text-slate">{description}</p>
      </div>
      {children}
    </section>
  );
}
