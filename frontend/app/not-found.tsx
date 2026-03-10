import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-sand px-6">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-slate">404</p>
        <h1 className="mt-4 font-display text-4xl">Page not found</h1>
        <p className="mt-4 text-sm text-slate">
          This route is protected by audit trails. Return to the safe vault.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-ink px-6 py-3 text-sm text-sand"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
