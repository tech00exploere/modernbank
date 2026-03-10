const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function maskAccount(account: string) {
  const parts = account.split("-");

  if (parts.length !== 3) {
    return account;
  }

  return `${parts[0]}-XXXX-${parts[2]}`;
}

export function formatINR(amount: number) {
  return inrFormatter.format(amount);
}
