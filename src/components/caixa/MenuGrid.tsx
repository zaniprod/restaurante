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
    <div>
      {categories.map((category) => (
        <section key={category}>
          <h2>{category}</h2>
          {items
            .filter((item) => item.category === category)
            .map((item) => (
              <div key={item.id}>
                <button type="button" onClick={() => (item.manualValue ? setOpenItemId(item.id) : onSelect(item))}>
                  {item.manualValue ? item.name : `${item.name} — ${formatBRL(item.price ?? 0)}`}
                </button>

                {item.manualValue && openItemId === item.id && (
                  <div>
                    <label htmlFor={`valor-${item.id}`}>Valor</label>
                    <input
                      id={`valor-${item.id}`}
                      type="number"
                      step="0.01"
                      value={manualValue}
                      onChange={(e) => setManualValue(e.target.value)}
                    />
                    <button type="button" onClick={() => handleManualSubmit(item)}>
                      Adicionar
                    </button>
                  </div>
                )}
              </div>
            ))}
        </section>
      ))}
    </div>
  );
}
