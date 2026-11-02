"use client";

import { useEffect, useState } from "react";
import { aggregateRevenueByDay, type DailyRevenue } from "@/lib/reports/revenue";
import { listSalesByDate, type SaleWithDetails } from "@/lib/sales/actions";

function formatBRL(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

function datesInCurrentMonth(): string[] {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = String(i + 1).padStart(2, "0");
    const monthStr = String(month + 1).padStart(2, "0");
    return `${year}-${monthStr}-${day}`;
  });
}

export default function AdminDashboardPage() {
  const [revenue, setRevenue] = useState<DailyRevenue[]>([]);

  useEffect(() => {
    async function load() {
      const dates = datesInCurrentMonth();
      const results = await Promise.all(dates.map((date) => listSalesByDate(date)));
      const allSales: SaleWithDetails[] = results.flat();
      setRevenue(aggregateRevenueByDay(allSales));
    }
    load();
  }, []);

  const byDate = new Map(revenue.map((r) => [r.date, r]));

  return (
    <div>
      <h1>Faturamento do mês</h1>
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
          {datesInCurrentMonth().map((date) => {
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
