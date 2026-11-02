"use client";

import { useState } from "react";
import { calculateChangeCents, validatePayments, type PaymentEntry, type PaymentMethod } from "@/lib/pos/payments";

function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function toNumber(value: string): number {
  return value === "" ? 0 : parseFloat(value);
}

type Row = { method: PaymentMethod; amount: string; cashReceived: string };

export function PaymentForm(props: {
  totalCents: number;
  onConfirm: (payments: PaymentEntry[]) => void;
  initialPayments?: PaymentEntry[];
}) {
  const { totalCents, onConfirm, initialPayments } = props;
  const [rows, setRows] = useState<Row[]>(() =>
    initialPayments && initialPayments.length > 0
      ? initialPayments.map((payment) => ({
          method: payment.method,
          amount: String(payment.amount),
          cashReceived: payment.cashReceived != null ? String(payment.cashReceived) : "",
        }))
      : [{ method: "dinheiro", amount: String(totalCents / 100), cashReceived: "" }],
  );
  const [error, setError] = useState<string | null>(null);

  // A blank "valor recebido" means the customer paid exactly that amount in cash — not zero.
  function effectiveCashReceived(row: Row): number {
    return row.cashReceived === "" ? toNumber(row.amount) : toNumber(row.cashReceived);
  }

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((current) => [...current, { method: "pix", amount: "", cashReceived: "" }]);
  }

  function handleConfirm() {
    const payments: PaymentEntry[] = rows.map((row) => ({
      method: row.method,
      amount: toNumber(row.amount),
      ...(row.method === "dinheiro" ? { cashReceived: effectiveCashReceived(row) } : {}),
    }));

    const result = validatePayments(payments, totalCents);

    if (!result.valid) {
      setError(result.error ?? "Pagamento inválido.");
      return;
    }

    setError(null);
    onConfirm(payments);
  }

  return (
    <div>
      {rows.map((row, index) => (
        <div key={index}>
          <select
            value={row.method}
            onChange={(e) => updateRow(index, { method: e.target.value as PaymentMethod })}
          >
            <option value="dinheiro">Dinheiro</option>
            <option value="pix">Pix</option>
            <option value="cartao">Cartão</option>
          </select>

          <label htmlFor={`valor-${index}`}>Valor</label>
          <input
            id={`valor-${index}`}
            type="number"
            step="0.01"
            value={row.amount}
            onChange={(e) => updateRow(index, { amount: e.target.value })}
          />

          {row.method === "dinheiro" && (
            <>
              <label htmlFor={`valor-recebido-${index}`}>Valor recebido</label>
              <input
                id={`valor-recebido-${index}`}
                type="number"
                step="0.01"
                value={row.cashReceived}
                onChange={(e) => updateRow(index, { cashReceived: e.target.value })}
              />
              <span>Troco:</span>{" "}
              <span>
                {formatBRL(
                  calculateChangeCents(
                    Math.round(effectiveCashReceived(row) * 100),
                    Math.round(toNumber(row.amount) * 100),
                  ) / 100,
                )}
              </span>
            </>
          )}
        </div>
      ))}

      <button type="button" onClick={addRow}>
        Adicionar forma de pagamento
      </button>

      {error && <p role="alert">{error}</p>}

      <button type="button" onClick={handleConfirm}>
        Confirmar
      </button>
    </div>
  );
}
