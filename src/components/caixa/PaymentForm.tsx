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

  const inputClass =
    "w-full border-b border-line bg-transparent px-1 py-1.5 text-sm text-ink outline-none focus:border-green";

  return (
    <div className="space-y-4">
      {rows.map((row, index) => (
        <div key={index} className="grid grid-cols-2 gap-3 border border-line bg-white/50 p-3">
          <div>
            <label className="block text-xs text-ink-soft">Forma</label>
            <select
              value={row.method}
              onChange={(e) => updateRow(index, { method: e.target.value as PaymentMethod })}
              className={inputClass}
            >
              <option value="dinheiro">Dinheiro</option>
              <option value="pix">Pix</option>
              <option value="cartao">Cartão</option>
            </select>
          </div>

          <div>
            <label htmlFor={`valor-${index}`} className="block text-xs text-ink-soft">
              Valor
            </label>
            <input
              id={`valor-${index}`}
              type="number"
              step="0.01"
              value={row.amount}
              onChange={(e) => updateRow(index, { amount: e.target.value })}
              className={`${inputClass} text-right`}
            />
          </div>

          {row.method === "dinheiro" && (
            <>
              <div>
                <label htmlFor={`valor-recebido-${index}`} className="block text-xs text-ink-soft">
                  Valor recebido
                </label>
                <input
                  id={`valor-recebido-${index}`}
                  type="number"
                  step="0.01"
                  value={row.cashReceived}
                  onChange={(e) => updateRow(index, { cashReceived: e.target.value })}
                  className={`${inputClass} text-right`}
                />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-xs text-ink-soft">Troco:</span>{" "}
                <span className="font-medium text-green">
                  {formatBRL(
                    calculateChangeCents(
                      Math.round(effectiveCashReceived(row) * 100),
                      Math.round(toNumber(row.amount) * 100),
                    ) / 100,
                  )}
                </span>
              </div>
            </>
          )}
        </div>
      ))}

      <button type="button" onClick={addRow} className="text-sm text-green underline-offset-2 hover:underline">
        Adicionar forma de pagamento
      </button>

      {error && (
        <p role="alert" className="text-sm text-rust">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleConfirm}
        className="w-full bg-green py-3 text-base font-medium text-paper transition-colors hover:bg-green-dark"
      >
        Confirmar
      </button>
    </div>
  );
}
