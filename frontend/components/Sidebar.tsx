"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getMe } from "../lib/api";

const baseItems = [ 
  { label: "Overview", href: "/dashboard" },
  { label: "Account", href: "/dashboard/account" },
  { label: "Transfer", href: "/dashboard/transfer" },
  { label: "Transactions", href: "/dashboard/transactions" },
  { label: "Loan", href: "/dashboard/loan" },
  { label: "Support", href: "/dashboard/support" },
];

const adminItems = [{ label: "Admin Console", href: "/dashboard/admin" }];

export default function Sidebar() {
  const [role, setRole] = useState<"USER" | "ADMIN" | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const me = await getMe();
        if (mounted) {
          setRole(me.role);
        }
      } catch {
        if (mounted) {
          setRole("USER");
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const items = useMemo(() => {
    if (role === "ADMIN") {
      return [...baseItems, ...adminItems];
    }
    return baseItems;
  }, [role]);

  return (
    <aside className="hidden h-full w-64 flex-col gap-6 border-r border-ink/10 bg-white/70 p-6 lg:flex">
      <div className="flex items-center gap-3">
        <Image
          src="/logo.png"
          alt="Modern Bank logo"
          width={38}
          height={38}
          className="rounded-full border border-ink/10 bg-white object-cover"
        />
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate">Modern</p>
          <p className="font-display text-2xl">Bank</p>
        </div>
      </div>
      <nav className="flex flex-col gap-3 text-sm">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl px-3 py-2 text-slate transition hover:bg-ink/5 hover:text-ink"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {role === "ADMIN" ? (
        <div className="rounded-2xl border border-ink/10 bg-sand/60 p-3 text-xs uppercase tracking-[0.2em] text-slate">
          Admin access enabled
        </div>
      ) : null}
      <div className="mt-auto rounded-2xl bg-ink p-4 text-sand">
        <p className="text-xs uppercase tracking-[0.3em] text-sand/70">Trust</p>
        <p className="mt-2 text-sm">
          Role-based access, audit trails, and immutable transaction history.
        </p>
      </div>
    </aside>
  );
}
