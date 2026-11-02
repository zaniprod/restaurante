"use client";

import { useEffect, useState } from "react";
import { PurchaseForm } from "@/components/admin/PurchaseForm";
import {
  addPurchase,
  deletePurchase,
  getPurchasePhotoUrl,
  listPurchases,
  suggestProductNames,
  type Purchase,
} from "@/lib/purchases/actions";
import { currentMonthRangeInBrazil } from "@/lib/date";

function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export default function ComprasPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const { from, to } = currentMonthRangeInBrazil();
    const result = await listPurchases(from, to);
    setPurchases(result);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
    reload();
  }, []);

  async function handleSubmit(purchase: {
    date: string;
    items: { productName: string; quantity: string; value: number }[];
    photo?: File;
  }) {
    if (purchase.date === "" || purchase.items.every((item) => item.productName === "")) {
      setError("Preencha a data e ao menos um item.");
      return;
    }

    try {
      await addPurchase(purchase.date, purchase.items, purchase.photo);
      setError(null);
      await reload();
    } catch {
      setError("Não foi possível salvar a compra. Verifique a conexão e tente novamente.");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Excluir esta compra?")) return;
    try {
      await deletePurchase(id);
      await reload();
    } catch {
      setError("Não foi possível excluir a compra. Verifique a conexão e tente novamente.");
    }
  }

  async function handleViewPhoto(photoPath: string) {
    try {
      const url = await getPurchasePhotoUrl(photoPath);
      window.open(url, "_blank");
    } catch {
      setError("Não foi possível abrir a nota fiscal.");
    }
  }

  const monthTotal = purchases.reduce((sum, p) => sum + p.total, 0);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Compras de mercado</h1>
      <p className="mt-1 text-sm text-ink-soft">Este mês, {formatBRL(monthTotal)} no total</p>

      <div className="mt-6 rounded-lg border border-line bg-white/40 p-4">
        <PurchaseForm onSubmit={handleSubmit} onSearchProduct={suggestProductNames} />
        {error && (
          <p role="alert" className="mt-3 text-sm text-rust">
            {error}
          </p>
        )}
      </div>

      <h2 className="mt-8 mb-2 text-sm text-ink-soft">Compras do mês</h2>
      {purchases.length === 0 && <p className="py-4 text-sm text-ink-soft">Nenhuma compra lançada.</p>}
      <ul>
        {purchases.map((purchase) => (
          <li key={purchase.id} className="flex items-center gap-3 border-b border-line py-2 text-sm">
            <span className="w-24 shrink-0 text-ink-soft">{purchase.date}</span>
            <span className="flex-1 text-ink">
              {purchase.items.length} {purchase.items.length === 1 ? "item" : "itens"}
            </span>
            <span className="tabular-nums font-medium text-ink">{formatBRL(purchase.total)}</span>
            {purchase.photoPath && (
              <button
                type="button"
                onClick={() => handleViewPhoto(purchase.photoPath!)}
                className="text-xs text-green underline-offset-2 hover:underline"
              >
                Ver nota
              </button>
            )}
            <button
              type="button"
              onClick={() => handleDelete(purchase.id)}
              className="text-xs text-rust underline-offset-2 hover:underline"
            >
              Excluir
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
