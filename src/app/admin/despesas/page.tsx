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

  return (
    <div>
      <h1>Despesas</h1>
      <ExpenseForm onSubmit={handleSubmit} />
      {error && <p role="alert">{error}</p>}

      <h2>Despesas do mês</h2>
      <ul>
        {expenses.map((expense) => (
          <li key={expense.id}>
            {expense.date} — {expense.description} — {formatBRL(expense.amount)}{" "}
            <button type="button" onClick={() => handleDelete(expense.id)}>
              Excluir
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
