"use client";

import { useState } from "react";

export function ExpenseForm(props: {
  onSubmit: (expense: { date: string; description: string; amount: number }) => void;
}) {
  const { onSubmit } = props;
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    if (description.trim() === "") {
      setError("Descrição é obrigatória.");
      return;
    }

    setError(null);
    onSubmit({ date, description, amount: parseFloat(amount || "0") });
  }

  const inputClass = "w-full border-b border-line bg-transparent py-1.5 text-sm text-ink outline-none focus:border-green";

  return (
    <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[140px_1fr_140px_auto]">
      <div>
        <label htmlFor="expense-date" className="block text-xs text-ink-soft">
          Data
        </label>
        <input id="expense-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
      </div>

      <div>
        <label htmlFor="expense-description" className="block text-xs text-ink-soft">
          Descrição
        </label>
        <input
          id="expense-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="expense-amount" className="block text-xs text-ink-soft">
          Valor
        </label>
        <input
          id="expense-amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={`${inputClass} text-right`}
        />
      </div>

      <button type="button" onClick={handleSubmit} className="bg-green px-5 py-2 text-sm font-medium text-paper hover:bg-green-dark">
        Salvar
      </button>

      {error && (
        <p role="alert" className="sm:col-span-4 text-sm text-rust">
          {error}
        </p>
      )}
    </div>
  );
}
