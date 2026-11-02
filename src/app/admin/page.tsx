"use client";

import { useEffect, useState } from "react";
import { aggregateRevenueByDay, type DailyRevenue } from "@/lib/reports/revenue";
import { listSalesBetween } from "@/lib/sales/actions";
import { currentMonthRangeInBrazil } from "@/lib/date";

function formatBRL(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export default function AdminDashboardPage() {
  const [revenue, setRevenue] = useState<DailyRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const { from, to, dates } = currentMonthRangeInBrazil();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const sales = await listSalesBetween(from, to);
      setRevenue(aggregateRevenueByDay(sales));
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const byDate = new Map(revenue.map((r) => [r.date, r]));

  const monthTotalCents = revenue.reduce((sum, r) => sum + r.totalCents, 0);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Faturamento</h1>
      <p className="mt-1 text-sm text-ink-soft">{loading ? "Carregando…" : `Este mês, ${formatBRL(monthTotalCents)} no total`}</p>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left text-ink-soft">
            <th className="py-2 pr-4 font-normal">Data</th>
            <th className="py-2 pr-4 text-right font-normal">Total</th>
            <th className="py-2 pr-4 text-right font-normal">Dinheiro</th>
            <th className="py-2 pr-4 text-right font-normal">Pix</th>
            <th className="py-2 text-right font-normal">Cartão</th>
          </tr>
        </thead>
        <tbody>
          {dates.map((date) => {
            const entry = byDate.get(date);
            const hasRevenue = (entry?.totalCents ?? 0) > 0;
            return (
              <tr key={date} className="border-b border-line/60">
                <td className="py-1.5 pr-4 text-ink-soft">{date}</td>
                <td className={`py-1.5 pr-4 text-right tabular-nums ${hasRevenue ? "font-medium text-ink" : "text-ink-soft"}`}>
                  {formatBRL(entry?.totalCents ?? 0)}
                </td>
                <td className="py-1.5 pr-4 text-right tabular-nums text-ink-soft">{formatBRL(entry?.byMethod.dinheiro ?? 0)}</td>
                <td className="py-1.5 pr-4 text-right tabular-nums text-ink-soft">{formatBRL(entry?.byMethod.pix ?? 0)}</td>
                <td className="py-1.5 text-right tabular-nums text-ink-soft">{formatBRL(entry?.byMethod.cartao ?? 0)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
