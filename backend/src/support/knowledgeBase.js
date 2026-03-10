const knowledgeBase = [
  {
    id: "kyc-status",
    topic: "KYC",
    keywords: ["kyc", "verification", "pending", "documents"],
    answer:
      "KYC verification may remain PENDING until an admin reviews your details. Keep your phone and government ID updated in your profile.",
  },
  {
    id: "balance-transfer",
    topic: "Transfers",
    keywords: ["transfer", "failed", "insufficient", "balance"],
    answer:
      "Transfers require sufficient balance and a valid destination account number. If transfer fails, balance should not be deducted permanently.",
  },
  {
    id: "transaction-history",
    topic: "Transactions",
    keywords: ["transactions", "history", "statement", "passbook"],
    answer:
      "You can review transactions in the dashboard Transactions section, including status and timestamp for each entry.",
  },
  {
    id: "loan-support",
    topic: "Loans",
    keywords: ["loan", "emi", "credit", "approval"],
    answer:
      "Loan requests go through score checks and admin approval. Keep income and purpose details accurate for faster processing.",
  },
];

module.exports = { knowledgeBase };
