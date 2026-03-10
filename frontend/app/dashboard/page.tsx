"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StatCard from "../../components/StatCard";
import TransactionTable from "../../components/TransactionTable";
import {
  getMe,
  getTransactions,
  AccountUser,
  TransactionRow,
} from "../../lib/api";
import { formatINR, maskAccount } from "../../lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AccountUser | null>(null);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    const [me, txns] = await Promise.all([getMe(), getTransactions(10)]);
    setUser(me);
    setTransactions(txns);
  };

  useEffect(() => {
    const load = async () => {
      try {
        await loadDashboard();
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  if (loading) {
    return <p className="text-sm text-slate">Loading dashboard...</p>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-3">
        <StatCard
          label="Account balance"
          value={formatINR(user.balance)}
          hint="Available"
        />
        <StatCard label="Account number" value={maskAccount(user.accountNo)} />
        <StatCard label="Status" value={user.status} hint={`Role: ${user.role}`} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <TransactionTable rows={transactions} />
        <div className="space-y-6">
          <div className="rounded-3xl bg-ink p-6 text-sand shadow-card">
            <p className="text-xs uppercase tracking-[0.3em] text-sand/60">
              Security
            </p>
            <p className="mt-3 text-sm text-sand/80">
              All transfers use account locks, balance checks, and atomic commits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
