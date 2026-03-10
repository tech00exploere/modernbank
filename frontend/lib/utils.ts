export function maskAccount(account: string) {
  const parts = account.split("-");
  return `${parts[0]}-XXXX-${parts[2]}`;
}

export function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
