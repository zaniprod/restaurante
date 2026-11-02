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

  return (
    <div>
      <h1>Compras de mercado</h1>
      <PurchaseForm onSubmit={handleSubmit} onSearchProduct={suggestProductNames} />
      {error && <p role="alert">{error}</p>}

      <h2>Compras do mês</h2>
      <ul>
        {purchases.map((purchase) => (
          <li key={purchase.id}>
            {purchase.date} — {formatBRL(purchase.total)} — {purchase.items.length} item(ns){" "}
            {purchase.photoPath && (
              <button type="button" onClick={() => handleViewPhoto(purchase.photoPath!)}>
                Ver nota
              </button>
            )}{" "}
            <button type="button" onClick={() => handleDelete(purchase.id)}>
              Excluir
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
