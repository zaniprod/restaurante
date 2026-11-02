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

  return (
    <div>
      <h1>Balanço do mês</h1>
      {loading && <p>Carregando...</p>}
      <p>Receita: {formatBRL(revenueCents)}</p>
      <p>Despesas: {formatBRL(expensesCents)}</p>
      <p>Compras: {formatBRL(purchasesCents)}</p>
      <p style={{ color: balanceCents < 0 ? "red" : "green" }}>Balanço: {formatBRL(balanceCents)}</p>
    </div>
  );
}
