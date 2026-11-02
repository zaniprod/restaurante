"use client";

import { useState } from "react";

type Row = { productName: string; quantity: string; value: string };

export function PurchaseForm(props: {
  onSubmit: (purchase: {
    date: string;
    items: { productName: string; quantity: string; value: number }[];
    photo?: File;
  }) => void;
  onSearchProduct: (query: string) => Promise<string[]>;
}) {
  const { onSubmit, onSearchProduct } = props;
  const [date, setDate] = useState("");
  const [rows, setRows] = useState<Row[]>([{ productName: "", quantity: "", value: "" }]);
  const [photo, setPhoto] = useState<File | undefined>(undefined);
  const [suggestions, setSuggestions] = useState<{ index: number; names: string[] } | null>(null);

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((current) => [...current, { productName: "", quantity: "", value: "" }]);
  }

  async function handleProductChange(index: number, value: string) {
    updateRow(index, { productName: value });
    const names = await onSearchProduct(value);
    setSuggestions({ index, names });
  }

  function selectSuggestion(index: number, name: string) {
    updateRow(index, { productName: name });
    setSuggestions(null);
  }

  function handleSubmit() {
    onSubmit({
      date,
      items: rows.map((row) => ({
        productName: row.productName,
        quantity: row.quantity,
        value: parseFloat(row.value || "0"),
      })),
      photo,
    });
  }

  const inputClass = "w-full border-b border-line bg-transparent py-1.5 text-sm text-ink outline-none focus:border-green";

  return (
    <div className="space-y-4">
      <div className="max-w-[160px]">
        <label htmlFor="purchase-date" className="block text-xs text-ink-soft">
          Data
        </label>
        <input id="purchase-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
      </div>

      {rows.map((row, index) => (
        <div key={index} className="relative grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px_120px]">
          <div>
            <label htmlFor={`produto-${index}`} className="block text-xs text-ink-soft">
              Produto
            </label>
            <input
              id={`produto-${index}`}
              type="text"
              value={row.productName}
              onChange={(e) => handleProductChange(index, e.target.value)}
              className={inputClass}
            />
            {suggestions?.index === index && suggestions.names.length > 0 && (
              <div className="absolute z-10 mt-1 border border-line bg-paper shadow-none">
                {suggestions.names.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => selectSuggestion(index, name)}
                    className="block w-full px-3 py-1.5 text-left text-sm text-ink hover:bg-paper-dim"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor={`quantidade-${index}`} className="block text-xs text-ink-soft">
              Quantidade
            </label>
            <input
              id={`quantidade-${index}`}
              type="text"
              value={row.quantity}
              onChange={(e) => updateRow(index, { quantity: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor={`valor-${index}`} className="block text-xs text-ink-soft">
              Valor
            </label>
            <input
              id={`valor-${index}`}
              type="number"
              step="0.01"
              value={row.value}
              onChange={(e) => updateRow(index, { value: e.target.value })}
              className={`${inputClass} text-right`}
            />
          </div>
        </div>
      ))}

      <button type="button" onClick={addRow} className="text-sm text-green underline-offset-2 hover:underline">
        Adicionar item
      </button>

      <div className="border-t border-line pt-4">
        <label htmlFor="purchase-photo" className="block text-xs text-ink-soft">
          Nota fiscal
        </label>
        <input id="purchase-photo" type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0])} className="mt-1 text-sm" />
      </div>

      <button type="button" onClick={handleSubmit} className="bg-green px-5 py-2 text-sm font-medium text-paper hover:bg-green-dark">
        Salvar
      </button>
    </div>
  );
}
