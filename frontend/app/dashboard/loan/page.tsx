"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { applyLoan, getLoans, LoanRow, payLoanEmi } from "../../../lib/api";
import { formatINR } from "../../../lib/utils";

export default function LoanPage() {
  const router = useRouter();
  const [loanAmount, setLoanAmount] = useState("");
  const [tenureMonths, setTenureMonths] = useState("");
  const [annualIncome, setAnnualIncome] = useState("");
  const [purpose, setPurpose] = useState("");
  const [loans, setLoans] = useState<LoanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payingLoanId, setPayingLoanId] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const activeLoan = useMemo(
    () => loans.find((loan) => loan.status === "ACTIVE" || loan.status === "APPROVED") || null,
    [loans]
  );

  const refreshLoans = async () => {
    const rows = await getLoans();
    setLoans(rows);
  };

  useEffect(() => {
    const load = async () => {
      try {
        await refreshLoans();
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  const handleApply = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const parsedLoanAmount = Number(loanAmount);
    const parsedTenureMonths = Number(tenureMonths);
    const parsedAnnualIncome = Number(annualIncome);

    if (
      !Number.isFinite(parsedLoanAmount) ||
      !Number.isFinite(parsedTenureMonths) ||
      !Number.isFinite(parsedAnnualIncome) ||
      parsedLoanAmount <= 0 ||
      parsedTenureMonths <= 0 ||
      parsedAnnualIncome < 0
    ) {
      setErrorMessage("Please enter valid values for loan application.");
      return;
    }

    setSubmitting(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      const response = await applyLoan({
        loanAmount: parsedLoanAmount,
        tenureMonths: parsedTenureMonths,
        annualIncome: parsedAnnualIncome,
        purpose: purpose.trim(),
      });
      setStatusMessage(response.message);
      setLoanAmount("");
      setTenureMonths("");
      setAnnualIncome("");
      setPurpose("");
      await refreshLoans();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to submit loan application."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayEmi = async (loanId: string) => {
    if (payingLoanId) {
      return;
    }

    setPayingLoanId(loanId);
    setStatusMessage("");
    setErrorMessage("");

    try {
      const response = await payLoanEmi(loanId);
      setStatusMessage(`${response.message}. Paid ${formatINR(response.paidAmount)}.`);
      await refreshLoans();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to process EMI payment.");
    } finally {
      setPayingLoanId("");
    }
  };

  if (loading) {
    return <p className="text-sm text-slate">Loading loan details...</p>;
  }

  return (
    <ProtectedRoute
      title="Loan management"
      description="Apply for credit online, track status, and manage EMI payments."
    >
      <form onSubmit={handleApply} className="grid gap-4 md:grid-cols-2">
        <label className="text-sm text-slate">
          Loan amount
          <input
            type="number"
            min="1"
            step="0.01"
            value={loanAmount}
            onChange={(event) => setLoanAmount(event.target.value)}
            placeholder="50000"
            className="mt-2 w-full rounded-xl border border-ink/10 bg-sand/50 px-4 py-3 text-sm"
            required
          />
        </label>
        <label className="text-sm text-slate">
          Tenure (months)
          <input
            type="number"
            min="1"
            value={tenureMonths}
            onChange={(event) => setTenureMonths(event.target.value)}
            placeholder="24"
            className="mt-2 w-full rounded-xl border border-ink/10 bg-sand/50 px-4 py-3 text-sm"
            required
          />
        </label>
        <label className="text-sm text-slate">
          Annual income
          <input
            type="number"
            min="0"
            step="0.01"
            value={annualIncome}
            onChange={(event) => setAnnualIncome(event.target.value)}
            placeholder="120000"
            className="mt-2 w-full rounded-xl border border-ink/10 bg-sand/50 px-4 py-3 text-sm"
            required
          />
        </label>
        <label className="text-sm text-slate">
          Purpose
          <input
            type="text"
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
            placeholder="Home renovation"
            className="mt-2 w-full rounded-xl border border-ink/10 bg-sand/50 px-4 py-3 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="md:col-span-2 rounded-full bg-ink px-4 py-3 text-sm text-sand disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Submit loan request"}
        </button>
      </form>

      {errorMessage ? (
        <div className="mt-4 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}
      {statusMessage ? (
        <div className="mt-4 rounded-2xl border border-moss/30 bg-moss/10 p-4 text-sm text-moss">
          {statusMessage}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-ink/10 bg-sand/60 p-4 text-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate">Current status</p>
          <p className="mt-2">{activeLoan?.status || "NO ACTIVE LOAN"}</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-sand/60 p-4 text-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate">EMI due</p>
          <p className="mt-2">{activeLoan ? formatINR(activeLoan.monthlyEmi) : "N/A"}</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-sand/60 p-4 text-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate">Credit score</p>
          <p className="mt-2">{activeLoan?.creditScore || "N/A"}</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {loans.length === 0 ? (
          <div className="rounded-2xl border border-ink/10 bg-sand/60 p-4 text-sm text-slate">
            No loan applications found.
          </div>
        ) : null}

        {loans.map((loan) => (
          <div key={loan._id} className="rounded-2xl border border-ink/10 bg-white p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium text-ink">
                {formatINR(loan.principalAmount)} • {loan.status}
              </p>
              {loan.status === "ACTIVE" || loan.status === "APPROVED" ? (
                <button
                  type="button"
                  disabled={payingLoanId === loan._id}
                  onClick={() => handlePayEmi(loan._id)}
                  className="rounded-full bg-ink px-4 py-2 text-xs text-sand disabled:opacity-60"
                >
                  {payingLoanId === loan._id ? "Processing..." : "Pay EMI"}
                </button>
              ) : null}
            </div>
            <div className="mt-3 grid gap-2 text-slate md:grid-cols-2">
              <p>EMI: {formatINR(loan.monthlyEmi)}</p>
              <p>Remaining: {formatINR(loan.remainingPrincipal)}</p>
              <p>
                Paid installments: {loan.paidInstallments}/{loan.tenureMonths}
              </p>
              <p>Next due: {loan.nextDueDate ? new Date(loan.nextDueDate).toLocaleDateString() : "N/A"}</p>
            </div>
          </div>
        ))}
      </div>
    </ProtectedRoute>
  );
}
