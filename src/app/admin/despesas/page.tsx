"use client";

import { useEffect, useState } from "react";
import { ExpenseForm } from "@/components/admin/ExpenseForm";
import { addExpense, listExpenses, type Expense } from "@/lib/expenses/actions";

function currentMonthRange(): { from: string; to: string } {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const monthStr = String(month + 1).padStart(2, "0");

  return {
    from: `${year}-${monthStr}-01`,
    to: `${year}-${monthStr}-${String(lastDay).padStart(2, "0")}`,
  };
}

function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export default function DespesasPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  async function reload() {
    const { from, to } = currentMonthRange();
    const result = await listExpenses(from, to);
    setExpenses(result);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleSubmit(expense: { date: string; description: string; amount: number }) {
    await addExpense(expense.date, expense.description, expense.amount);
    await reload();
  }

  return (
    <div>
      <h1>Despesas</h1>
      <ExpenseForm onSubmit={handleSubmit} />

      <h2>Despesas do mês</h2>
      <ul>
        {expenses.map((expense) => (
          <li key={expense.id}>
            {expense.date} — {expense.description} — {formatBRL(expense.amount)}
          </li>
        ))}
      </ul>
    </div>
  );
}
