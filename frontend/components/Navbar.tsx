"use client";

import Image from "next/image";
import Link from "next/link";

const nav = [
  { label: "Product", href: "#product" },
  { label: "Security", href: "#security" },
  { label: "Roles", href: "#roles" },
  { label: "Operations", href: "#ops" },
];

export default function Navbar() {
  return (
    <nav className="section flex items-center justify-between py-6">
      <div className="flex items-center gap-3">
        <Image
          src="/logo.png"
          alt="Modern Bank logo"
          width={44}
          height={44}
          className="rounded-full border border-ink/10 bg-white object-cover"
        />
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate">Modern</p>
          <p className="font-display text-2xl">Bank</p>
        </div>
      </div>
      <div className="hidden items-center gap-6 text-sm md:flex">
        {nav.map((item) => (
          <Link key={item.href} href={item.href} className="text-slate hover:text-ink">
            {item.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="rounded-full border border-ink/20 bg-white px-4 py-2 text-sm font-semibold text-ink"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-sand"
        >
          Open account
        </Link>
      </div>
    </nav>
  );
}
