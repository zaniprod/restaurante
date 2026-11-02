"use client";

import { useState } from "react";
import type { MenuItem } from "@/lib/pos/cart";

function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export function MenuGrid(props: {
  items: MenuItem[];
  onSelect: (item: MenuItem, manualValue?: number) => void;
}) {
  const { items, onSelect } = props;
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [manualValue, setManualValue] = useState("");

  const categories = Array.from(new Set(items.map((item) => item.category)));

  function handleManualSubmit(item: MenuItem) {
    const value = parseFloat(manualValue);
    if (Number.isNaN(value)) return;
    onSelect(item, value);
    setOpenItemId(null);
    setManualValue("");
  }

  return (
    <div className="space-y-8">
      {categories.map((category) => (
        <section key={category}>
          <h2 className="mb-3 border-b border-line pb-2 font-serif text-lg text-ink">{category}</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {items
              .filter((item) => item.category === category)
              .map((item) => (
                <div key={item.id}>
                  <button
                    type="button"
                    onClick={() => (item.manualValue ? setOpenItemId(item.id) : onSelect(item))}
                    className="flex w-full flex-col items-start gap-1 border border-line bg-white/50 px-3 py-3 text-left transition-colors hover:border-green hover:bg-green/5"
                  >
                    <span className="text-sm leading-snug text-ink">{item.name}</span>
                    {!item.manualValue && (
                      <span className="text-sm font-medium text-green">{formatBRL(item.price ?? 0)}</span>
                    )}
                  </button>

                  {item.manualValue && openItemId === item.id && (
                    <div className="mt-1 flex items-center gap-2 border border-line bg-paper-dim px-2 py-2">
                      <label htmlFor={`valor-${item.id}`} className="text-sm text-ink-soft">
                        Valor
                      </label>
                      <input
                        id={`valor-${item.id}`}
                        type="number"
                        step="0.01"
                        value={manualValue}
                        onChange={(e) => setManualValue(e.target.value)}
                        className="w-20 border-b border-line bg-transparent text-right outline-none focus:border-green"
                      />
                      <button
                        type="button"
                        onClick={() => handleManualSubmit(item)}
                        className="bg-green px-3 py-1 text-sm font-medium text-paper hover:bg-green-dark"
                      >
                        Adicionar
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
