"use client";

import { useState } from "react";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { transferFunds, TransferResponse } from "../../../lib/api";
import { formatINR } from "../../../lib/utils";

export default function TransferPage() {
  const [recipientName, setRecipientName] = useState("");
  const [recipientAccount, setRecipientAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<TransferResponse | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const parsedAmount = Number(amount);
    if (!recipientAccount.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage("Enter a valid recipient account and amount.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setResult(null);

    try {
      const response = await transferFunds({
        toAccount: recipientAccount.trim(),
        amount: parsedAmount,
      });
      setResult(response);
      setAmount("");
      setPurpose("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Transfer failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute
      title="Fund transfer"
      description="Atomic transfers lock the sender account, validate the receiver, and commit only when both sides pass."
    >
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <label className="text-sm text-slate">
          Recipient name
          <input
            type="text"
            placeholder="Rohan Mehta"
            value={recipientName}
            onChange={(event) => setRecipientName(event.target.value)}
            className="mt-2 w-full rounded-xl border border-ink/10 bg-sand/50 px-4 py-3 text-sm"
          />
        </label>
        <label className="text-sm text-slate">
          Recipient account
          <input
            type="text"
            placeholder="AB-7812-9911"
            value={recipientAccount}
            onChange={(event) => setRecipientAccount(event.target.value)}
            className="mt-2 w-full rounded-xl border border-ink/10 bg-sand/50 px-4 py-3 text-sm"
            required
          />
        </label>
        <label className="text-sm text-slate">
          Amount
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="INR 0.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="mt-2 w-full rounded-xl border border-ink/10 bg-sand/50 px-4 py-3 text-sm"
            required
          />
        </label>
        <label className="text-sm text-slate">
          Purpose
          <input
            type="text"
            placeholder="Invoice 2391"
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
            className="mt-2 w-full rounded-xl border border-ink/10 bg-sand/50 px-4 py-3 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="md:col-span-2 rounded-full bg-ink px-4 py-3 text-sm text-sand disabled:opacity-60"
        >
          {submitting ? "Processing..." : "Initiate transfer"}
        </button>
      </form>
      {errorMessage ? (
        <div className="mt-4 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}
      {result?.transfer ? (
        <div className="mt-4 rounded-2xl border border-ink/10 bg-white p-4 text-sm text-slate">
          <p className="font-medium text-ink">{result.message}</p>
          <p className="mt-2">Amount: {formatINR(result.transfer.amount)}</p>
          <p className="mt-1">Sender balance: {formatINR(result.transfer.sender.balance)}</p>
          <p className="mt-1">Sender reference: {result.transfer.sender.referenceId || "N/A"}</p>
          <p className="mt-1">Receiver balance: {formatINR(result.transfer.receiver.balance)}</p>
          <p className="mt-1">Receiver reference: {result.transfer.receiver.referenceId || "N/A"}</p>
        </div>
      ) : null}
      <div className="mt-6 rounded-2xl bg-sand/60 p-4 text-sm text-slate">
        If any validation fails, the transaction is rolled back and no balances change.
      </div>
    </ProtectedRoute>
  );
}
