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

  return (
    <div>
      <h1>Faturamento do mês</h1>
      {loading && <p>Carregando...</p>}
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Total</th>
            <th>Dinheiro</th>
            <th>Pix</th>
            <th>Cartão</th>
          </tr>
        </thead>
        <tbody>
          {dates.map((date) => {
            const entry = byDate.get(date);
            return (
              <tr key={date}>
                <td>{date}</td>
                <td>{formatBRL(entry?.totalCents ?? 0)}</td>
                <td>{formatBRL(entry?.byMethod.dinheiro ?? 0)}</td>
                <td>{formatBRL(entry?.byMethod.pix ?? 0)}</td>
                <td>{formatBRL(entry?.byMethod.cartao ?? 0)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
