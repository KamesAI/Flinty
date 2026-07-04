export type BillingPeriod = "monthly" | "annual";

export const ANNUAL_DISCOUNT = 0.2;

export function displayedMonthlyPrice(monthlyPrice: number, period: BillingPeriod): number {
  if (period === "monthly") return monthlyPrice;
  return Math.round(monthlyPrice * (1 - ANNUAL_DISCOUNT));
}

export function formatEuro(amount: number): string {
  return `${amount} €`;
}
