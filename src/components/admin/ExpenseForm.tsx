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

  return (
    <div>
      <label htmlFor="expense-date">Data</label>
      <input id="expense-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

      <label htmlFor="expense-description">Descrição</label>
      <input
        id="expense-description"
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <label htmlFor="expense-amount">Valor</label>
      <input
        id="expense-amount"
        type="number"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      {error && <p role="alert">{error}</p>}

      <button type="button" onClick={handleSubmit}>
        Salvar
      </button>
    </div>
  );
}
