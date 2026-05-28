"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TransactionTable from "../../../components/TransactionTable";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { getTransactionsPage, TransactionRow } from "../../../lib/api";

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1); 
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async (nextPage = 1) => {
    try {
      setLoading(true);
      const payload = await getTransactionsPage({
        page: nextPage,
        limit: 20,
        type: type || undefined,
        status: status || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setTransactions(payload.transactions);
      setPage(payload.pagination.page);
      setPages(payload.pagination.pages);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const applyFilters = async () => {
    await load(1);
  };

  const resetFilters = async () => {
    setType("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
    try {
      setLoading(true);
      const payload = await getTransactionsPage({ page: 1, limit: 20 });
      setTransactions(payload.transactions);
      setPage(payload.pagination.page);
      setPages(payload.pagination.pages);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const onPrev = async () => {
    if (page <= 1 || loading) return;
    await load(page - 1);
  };

  const onNext = async () => {
    if (page >= pages || loading) return;
    await load(page + 1);
  };

  return (
    <ProtectedRoute
      title="Transaction history"
      description="Every transaction is immutable, timestamped, and stored with balance snapshots."
    >
      <div className="space-y-6">
        <div className="grid gap-3 md:grid-cols-4">
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="rounded-2xl border border-ink/10 bg-sand/60 px-4 py-3 text-sm"
          >
            <option value="">All types</option>
            <option value="DEPOSIT">Deposit</option>
            <option value="WITHDRAW">Withdraw</option>
            <option value="TRANSFER_OUT">Transfer out</option>
            <option value="TRANSFER_IN">Transfer in</option>
            <option value="LOAN_CREDIT">Loan credit</option>
            <option value="EMI_PAYMENT">EMI payment</option>
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-2xl border border-ink/10 bg-sand/60 px-4 py-3 text-sm"
          >
            <option value="">All status</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
          <div className="rounded-2xl border border-ink/10 bg-sand/60 px-3 py-2">
            <div className="grid grid-cols-2 items-end gap-3">
              <label className="text-xs text-slate">
                <span className="mb-1 block">From</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="w-full rounded-xl border border-ink/10 bg-white px-2 py-2 text-sm"
                />
              </label>
              <label className="text-xs text-slate">
                <span className="mb-1 block">To</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="w-full rounded-xl border border-ink/10 bg-white px-2 py-2 text-sm"
                />
              </label>
            </div>
          </div>
          <div className="flex items-end justify-end gap-2">
            <button
              type="button"
              onClick={applyFilters}
              disabled={loading}
              className="rounded-xl bg-ink px-3 py-2 text-xs text-sand disabled:opacity-60"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={resetFilters}
              disabled={loading}
              className="rounded-xl border border-ink/20 bg-white px-3 py-2 text-xs text-ink disabled:opacity-60"
            >
              Reset
            </button>
          </div>
        </div>

        <TransactionTable rows={transactions} />

        <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-sand/60 px-4 py-3 text-sm">
          <p className="text-slate">
            Page {page} of {pages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onPrev}
              disabled={loading || page <= 1}
              className="rounded-xl border border-ink/20 bg-white px-3 py-2 disabled:opacity-60"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={loading || page >= pages}
              className="rounded-xl border border-ink/20 bg-white px-3 py-2 disabled:opacity-60"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
