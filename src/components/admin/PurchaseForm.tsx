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

  return (
    <div>
      <label htmlFor="purchase-date">Data</label>
      <input id="purchase-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

      {rows.map((row, index) => (
        <div key={index}>
          <label htmlFor={`produto-${index}`}>Produto</label>
          <input
            id={`produto-${index}`}
            type="text"
            value={row.productName}
            onChange={(e) => handleProductChange(index, e.target.value)}
          />
          {suggestions?.index === index && (
            <div>
              {suggestions.names.map((name) => (
                <button key={name} type="button" onClick={() => selectSuggestion(index, name)}>
                  {name}
                </button>
              ))}
            </div>
          )}

          <label htmlFor={`quantidade-${index}`}>Quantidade</label>
          <input
            id={`quantidade-${index}`}
            type="text"
            value={row.quantity}
            onChange={(e) => updateRow(index, { quantity: e.target.value })}
          />

          <label htmlFor={`valor-${index}`}>Valor</label>
          <input
            id={`valor-${index}`}
            type="number"
            step="0.01"
            value={row.value}
            onChange={(e) => updateRow(index, { value: e.target.value })}
          />
        </div>
      ))}

      <button type="button" onClick={addRow}>
        Adicionar item
      </button>

      <label htmlFor="purchase-photo">Nota fiscal</label>
      <input
        id="purchase-photo"
        type="file"
        onChange={(e) => setPhoto(e.target.files?.[0])}
      />

      <button type="button" onClick={handleSubmit}>
        Salvar
      </button>
    </div>
  );
}
