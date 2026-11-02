export function calculateBalance(revenueCents: number, expensesCents: number, purchasesCents: number): number {
  return revenueCents - expensesCents - purchasesCents;
}
