import { TransactionRow } from "../lib/api";
import { formatINR } from "../lib/utils";

type TransactionTableProps = {
  rows?: TransactionRow[];
};

export default function TransactionTable({ rows: apiRows }: TransactionTableProps) {
  const sourceRows = apiRows || [];
  const viewRows = sourceRows.map((row, index) => ({
    id: row.id || row._id || `TXN-${index + 1}`,
    type: row.type,
    amount: formatINR(Number(row.amount)),
    status: row.status,
    date: new Date(row.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
  }));

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate">History</p>
          <p className="font-display text-2xl">Recent Transactions</p>
        </div>
        <button className="rounded-full border border-ink/20 px-4 py-2 text-sm">
          Export
        </button>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-[1.8fr_1.3fr_1.1fr_1fr_1fr] gap-3 text-xs uppercase tracking-[0.3em] text-slate">
          <span>Id</span>
          <span>Type</span>
          <span>Amount</span>
          <span>Status</span>
          <span>Date</span>
        </div>
        <div className="mt-4 space-y-3 text-sm">
          {viewRows.length === 0 ? (
            <div className="rounded-2xl bg-sand/60 px-4 py-6 text-center text-slate">
              No transactions found.
            </div>
          ) : null}
          {viewRows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[1.8fr_1.3fr_1.1fr_1fr_1fr] items-center gap-3 rounded-2xl bg-sand/60 px-4 py-3"
            >
              <span className="truncate" title={row.id}>
                {row.id}
              </span>
              <span className="truncate" title={row.type}>
                {row.type}
              </span>
              <span className="font-medium">{row.amount}</span>
              <span
                className={
                  row.status === "PENDING" ? "text-ember" : "text-moss"
                }
              >
                {row.status}
              </span>
              <span>{row.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
