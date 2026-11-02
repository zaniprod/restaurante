"use client";

import { useState } from "react";
import {
  Coffee,
  Croissant,
  CupSoda,
  Hamburger,
  IceCreamCone,
  Sandwich,
  Search,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import type { MenuItem } from "@/lib/pos/cart";

function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Xis: Hamburger,
  Pratos: UtensilsCrossed,
  Bebidas: CupSoda,
  Sobremesas: IceCreamCone,
  Cafés: Coffee,
  Dogs: Sandwich,
  Lanches: Croissant,
};

function categoryIcon(category: string): LucideIcon {
  return CATEGORY_ICONS[category] ?? UtensilsCrossed;
}

export function MenuGrid(props: {
  items: MenuItem[];
  onSelect: (item: MenuItem, manualValue?: number) => void;
}) {
  const { items, onSelect } = props;
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [manualValue, setManualValue] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(items.map((item) => item.category)));

  const visibleItems = items.filter((item) => {
    const matchesCategory = activeCategory === null || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const visibleCategories = categories.filter((category) => visibleItems.some((item) => item.category === category));

  function handleManualSubmit(item: MenuItem) {
    const value = parseFloat(manualValue);
    if (Number.isNaN(value)) return;
    onSelect(item, value);
    setOpenItemId(null);
    setManualValue("");
  }

  return (
    <div>
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-soft" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar item..."
          aria-label="Buscar item"
          className="w-full rounded-lg border border-line bg-white/60 py-2 pr-3 pl-9 text-sm text-ink outline-none focus:border-green"
        />
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-sm transition-colors ${
            activeCategory === null ? "bg-green text-paper" : "bg-paper-dim text-ink-soft hover:text-ink"
          }`}
        >
          Todos
        </button>
        {categories.map((category) => {
          const Icon = categoryIcon(category);
          const active = activeCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(active ? null : category)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
                active ? "bg-green text-paper" : "bg-paper-dim text-ink-soft hover:text-ink"
              }`}
            >
              <Icon className="h-4 w-4" />
              {category}
            </button>
          );
        })}
      </div>

      {visibleItems.length === 0 && <p className="text-sm text-ink-soft">Nenhum item encontrado.</p>}

      <div className="space-y-8">
        {visibleCategories.map((category) => {
          const Icon = categoryIcon(category);
          return (
            <section key={category}>
              <h2 className="mb-3 flex items-center gap-2 border-b border-line pb-2 font-serif text-lg text-ink">
                <Icon className="h-5 w-5 text-green" />
                {category}
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {visibleItems
                  .filter((item) => item.category === category)
                  .map((item) => (
                    <div key={item.id}>
                      <button
                        type="button"
                        onClick={() => (item.manualValue ? setOpenItemId(item.id) : onSelect(item))}
                        className="flex w-full flex-col items-start gap-1 rounded-lg border border-line bg-white/50 px-3 py-3 text-left transition-colors hover:border-green hover:bg-green/5"
                      >
                        <span className="text-sm leading-snug text-ink">{item.name}</span>
                        {!item.manualValue && (
                          <span className="text-sm font-medium text-green">{formatBRL(item.price ?? 0)}</span>
                        )}
                      </button>

                      {item.manualValue && openItemId === item.id && (
                        <div className="mt-1 flex items-center gap-2 rounded-lg border border-line bg-paper-dim px-2 py-2">
                          <label htmlFor={`valor-${item.id}`} className="text-sm text-ink-soft">
                            Valor
                          </label>
                          <input
                            id={`valor-${item.id}`}
                            type="number"
                            step="0.01"
                            value={manualValue}
                            onChange={(e) => setManualValue(e.target.value)}
                            className="w-20 rounded border-b border-line bg-transparent text-right outline-none focus:border-green"
                          />
                          <button
                            type="button"
                            onClick={() => handleManualSubmit(item)}
                            className="rounded-lg bg-green px-3 py-1 text-sm font-medium text-paper hover:bg-green-dark"
                          >
                            Adicionar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
