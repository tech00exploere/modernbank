"use client";

import Sidebar from "../../components/Sidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setLoading(false);
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-sand">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 px-6 py-8 lg:px-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate">
                Customer workspace
              </p>
              <h1 className="font-display text-3xl">Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="rounded-full border border-ink/20 bg-white px-4 py-2 text-sm font-semibold text-ink"
              >
                Back to home
              </Link>
              <button
                className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-sand"
                onClick={handleLogout}
                disabled={loading}
              >
                {loading ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
