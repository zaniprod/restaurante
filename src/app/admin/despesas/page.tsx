"use client";

import { useEffect, useState } from "react";
import { ExpenseForm } from "@/components/admin/ExpenseForm";
import { addExpense, deleteExpense, listExpenses, type Expense } from "@/lib/expenses/actions";
import { currentMonthRangeInBrazil } from "@/lib/date";

function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export default function DespesasPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const { from, to } = currentMonthRangeInBrazil();
    const result = await listExpenses(from, to);
    setExpenses(result);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
    reload();
  }, []);

  async function handleSubmit(expense: { date: string; description: string; amount: number }) {
    if (expense.date === "" || expense.amount <= 0) {
      setError("Preencha a data e um valor maior que zero.");
      return;
    }

    try {
      await addExpense(expense.date, expense.description, expense.amount);
      setError(null);
      await reload();
    } catch {
      setError("Não foi possível salvar a despesa. Verifique a conexão e tente novamente.");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Excluir esta despesa?")) return;
    try {
      await deleteExpense(id);
      await reload();
    } catch {
      setError("Não foi possível excluir a despesa. Verifique a conexão e tente novamente.");
    }
  }

  const monthTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Despesas</h1>
      <p className="mt-1 text-sm text-ink-soft">Este mês, {formatBRL(monthTotal)} no total</p>

      <div className="mt-6 border border-line bg-white/40 p-4">
        <ExpenseForm onSubmit={handleSubmit} />
        {error && (
          <p role="alert" className="mt-3 text-sm text-rust">
            {error}
          </p>
        )}
      </div>

      <h2 className="mt-8 mb-2 text-sm text-ink-soft">Lançamentos do mês</h2>
      {expenses.length === 0 && <p className="py-4 text-sm text-ink-soft">Nenhuma despesa lançada.</p>}
      <ul>
        {expenses.map((expense) => (
          <li key={expense.id} className="flex items-center gap-3 border-b border-line py-2 text-sm">
            <span className="w-24 shrink-0 text-ink-soft">{expense.date}</span>
            <span className="flex-1 text-ink">{expense.description}</span>
            <span className="tabular-nums font-medium text-ink">{formatBRL(expense.amount)}</span>
            <button
              type="button"
              onClick={() => handleDelete(expense.id)}
              className="text-xs text-rust underline-offset-2 hover:underline"
            >
              Excluir
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
