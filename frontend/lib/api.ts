const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export type AccountUser = {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  governmentId?: string;
  role: "USER" | "ADMIN";
  status: "PENDING" | "ACTIVE";
  accountNo: string;
  balance: number;
  createdAt?: string;
};

export type TransactionRow={
  _id?: string;
  id?: string;
  accountNo: string;
  type: string;
  amount: number;
  balanceAfter: number;
  status: "PENDING" | "COMPLETED" | "FAILED";
  createdAt: string;
};

export type TransactionQuery = {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type TransactionListResponse = {
  transactions: TransactionRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export type UpdateMePayload = {
  name?: string;
  phone?: string;
  governmentId?: string;
};

export type TransferPayload = {
  toAccount: string;
  amount: number;
};

export type TransferResponse = {
  message: string;
  balance: number;
  transfer?: {
    amount: number;
    sender: {
      accountNo: string;
      balance: number;
      referenceId: string | null;
    };
    receiver: {
      accountNo: string;
      balance: number;
      referenceId: string | null;
    };
  };
};

export type BasicTransactionPayload = {
  type: "DEPOSIT" | "WITHDRAW";
  amount: number;
};

export type BasicTransactionResponse = {
  message: string;
  balance: number;
  transaction: TransactionRow;
};

export type LoanRow = {
  _id: string;
  accountNo: string;
  principalAmount: number;
  annualIncome: number;
  tenureMonths: number;
  purpose?: string;
  interestRateAnnual: number;
  monthlyEmi: number;
  totalPayable: number;
  totalPaid: number;
  remainingPrincipal: number;
  paidInstallments: number;
  creditScore: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ACTIVE" | "CLOSED";
  disbursedAt?: string | null;
  nextDueDate?: string | null;
  lastPaymentAt?: string | null;
  createdAt?: string;
};

export type LoanApplyPayload = {
  loanAmount: number;
  tenureMonths: number;
  annualIncome: number;
  purpose?: string;
};

export type LoanApplyResponse = {
  message: string;
  loan: LoanRow;
  balance?: number;
};

export type EmiPaymentResponse = {
  message: string;
  loan: LoanRow;
  balance: number;
  paidAmount: number;
};

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message || `Request failed (${response.status})`);
  }

  return response.json();
}

export async function getMe(): Promise<AccountUser> {
  const payload = await apiFetch<{ user: AccountUser }>("/accounts/me");
  return payload.user;
}

export async function getTransactions(limit = 20): Promise<TransactionRow[]> {
  const payload = await apiFetch<TransactionListResponse>(`/transactions?limit=${limit}`);
  return payload.transactions;
}

export async function getTransactionsPage(
  query: TransactionQuery = {}
): Promise<TransactionListResponse> {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.type) params.set("type", query.type);
  if (query.status) params.set("status", query.status);
  if (query.dateFrom) params.set("dateFrom", query.dateFrom);
  if (query.dateTo) params.set("dateTo", query.dateTo);

  const suffix = params.toString();
  return apiFetch<TransactionListResponse>(`/transactions${suffix ? `?${suffix}` : ""}`);
}

export async function updateMe(payload: UpdateMePayload): Promise<AccountUser> {
  const response = await apiFetch<{ user: AccountUser }>("/accounts/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return response.user;
}

export async function transferFunds(payload: TransferPayload): Promise<TransferResponse> {
  return apiFetch<TransferResponse>("/transactions/transfer", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function postTransaction(
  payload: BasicTransactionPayload
): Promise<BasicTransactionResponse> {
  return apiFetch<BasicTransactionResponse>("/transactions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function applyLoan(payload: LoanApplyPayload): Promise<LoanApplyResponse> {
  return apiFetch<LoanApplyResponse>("/loans/apply", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getLoans(): Promise<LoanRow[]> {
  const payload = await apiFetch<{ loans: LoanRow[] }>("/loans");
  return payload.loans;
}

export async function payLoanEmi(loanId: string, amount?: number): Promise<EmiPaymentResponse> {
  return apiFetch<EmiPaymentResponse>(`/loans/${loanId}/pay-emi`, {
    method: "POST",
    body: JSON.stringify(amount ? { amount } : {}),
  });
}
