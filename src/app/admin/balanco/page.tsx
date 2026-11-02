"use client";

import { useEffect, useState } from "react";
import { aggregateRevenueByDay } from "@/lib/reports/revenue";
import { calculateBalance } from "@/lib/reports/balance";
import { listSalesBetween } from "@/lib/sales/actions";
import { listExpenses } from "@/lib/expenses/actions";
import { listPurchases } from "@/lib/purchases/actions";
import { currentMonthRangeInBrazil } from "@/lib/date";

function formatBRL(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export default function BalancoPage() {
  const [revenueCents, setRevenueCents] = useState(0);
  const [expensesCents, setExpensesCents] = useState(0);
  const [purchasesCents, setPurchasesCents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { from, to } = currentMonthRangeInBrazil();

      const sales = await listSalesBetween(from, to);
      const revenue = aggregateRevenueByDay(sales).reduce((sum, day) => sum + day.totalCents, 0);

      const expenses = await listExpenses(from, to);
      const expensesTotal = expenses.reduce((sum, expense) => sum + Math.round(expense.amount * 100), 0);

      const purchases = await listPurchases(from, to);
      const purchasesTotal = purchases.reduce((sum, purchase) => sum + Math.round(purchase.total * 100), 0);

      setRevenueCents(revenue);
      setExpensesCents(expensesTotal);
      setPurchasesCents(purchasesTotal);
      setLoading(false);
    }

    load();
  }, []);

  const balanceCents = calculateBalance(revenueCents, expensesCents, purchasesCents);
  const positive = balanceCents >= 0;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Balanço</h1>
      <p className="mt-1 text-sm text-ink-soft">{loading ? "Carregando…" : "Receita menos despesas e compras, este mês"}</p>

      <div className="mt-8 rounded-lg border border-line bg-white/40 p-6">
        <p className="text-sm text-ink-soft">Balanço do mês</p>
        <p className={`font-serif text-5xl ${positive ? "text-green" : "text-rust"}`}>{formatBRL(balanceCents)}</p>
      </div>

      <div className="mt-6 grid grid-cols-1 divide-y divide-line rounded-lg border border-line bg-white/40 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="p-4">
          <p className="text-xs text-ink-soft">Receita</p>
          <p className="tabular-nums text-xl font-medium text-ink">{formatBRL(revenueCents)}</p>
        </div>
        <div className="p-4">
          <p className="text-xs text-ink-soft">Despesas</p>
          <p className="tabular-nums text-xl font-medium text-ink">{formatBRL(expensesCents)}</p>
        </div>
        <div className="p-4">
          <p className="text-xs text-ink-soft">Compras</p>
          <p className="tabular-nums text-xl font-medium text-ink">{formatBRL(purchasesCents)}</p>
        </div>
      </div>
    </div>
  );
}
