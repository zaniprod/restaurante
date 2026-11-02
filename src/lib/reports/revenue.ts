import type { SaleWithDetails } from "@/lib/sales/actions";
import type { PaymentMethod } from "@/lib/pos/payments";
import { toBrazilDate } from "@/lib/date";

export type DailyRevenue = {
  date: string;
  totalCents: number;
  byMethod: Record<PaymentMethod, number>;
};

function emptyByMethod(): Record<PaymentMethod, number> {
  return { dinheiro: 0, pix: 0, cartao: 0 };
}

export function aggregateRevenueByDay(sales: SaleWithDetails[]): DailyRevenue[] {
  const byDate = new Map<string, DailyRevenue>();

  for (const sale of sales) {
    const date = toBrazilDate(sale.createdAt);

    if (!byDate.has(date)) {
      byDate.set(date, { date, totalCents: 0, byMethod: emptyByMethod() });
    }

    if (sale.status === "cancelled") continue;

    const entry = byDate.get(date)!;

    for (const payment of sale.payments) {
      const cents = Math.round(payment.amount * 100);
      entry.totalCents += cents;
      entry.byMethod[payment.method] += cents;
    }
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}
