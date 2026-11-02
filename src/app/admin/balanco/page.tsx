"use client";

import { useEffect, useState } from "react";
import { aggregateRevenueByDay } from "@/lib/reports/revenue";
import { calculateBalance } from "@/lib/reports/balance";
import { listSalesByDate, type SaleWithDetails } from "@/lib/sales/actions";
import { listExpenses } from "@/lib/expenses/actions";
import { listPurchases } from "@/lib/purchases/actions";

function currentMonthRange(): { from: string; to: string; dates: string[] } {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const monthStr = String(month + 1).padStart(2, "0");

  const dates = Array.from({ length: lastDay }, (_, i) => `${year}-${monthStr}-${String(i + 1).padStart(2, "0")}`);

  return { from: dates[0], to: dates[dates.length - 1], dates };
}

function formatBRL(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export default function BalancoPage() {
  const [revenueCents, setRevenueCents] = useState(0);
  const [expensesCents, setExpensesCents] = useState(0);
  const [purchasesCents, setPurchasesCents] = useState(0);

  useEffect(() => {
    async function load() {
      const { from, to, dates } = currentMonthRange();

      const salesByDay = await Promise.all(dates.map((date) => listSalesByDate(date)));
      const allSales: SaleWithDetails[] = salesByDay.flat();
      const revenue = aggregateRevenueByDay(allSales).reduce((sum, day) => sum + day.totalCents, 0);

      const expenses = await listExpenses(from, to);
      const expensesTotal = expenses.reduce((sum, expense) => sum + Math.round(expense.amount * 100), 0);

      const purchases = await listPurchases(from, to);
      const purchasesTotal = purchases.reduce((sum, purchase) => sum + Math.round(purchase.total * 100), 0);

      setRevenueCents(revenue);
      setExpensesCents(expensesTotal);
      setPurchasesCents(purchasesTotal);
    }

    load();
  }, []);

  const balanceCents = calculateBalance(revenueCents, expensesCents, purchasesCents);

  return (
    <div>
      <h1>Balanço do mês</h1>
      <p>Receita: {formatBRL(revenueCents)}</p>
      <p>Despesas: {formatBRL(expensesCents)}</p>
      <p>Compras: {formatBRL(purchasesCents)}</p>
      <p style={{ color: balanceCents < 0 ? "red" : "green" }}>Balanço: {formatBRL(balanceCents)}</p>
    </div>
  );
}
