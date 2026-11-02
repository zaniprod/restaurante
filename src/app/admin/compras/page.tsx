"use client";

import { useEffect, useState } from "react";
import { PurchaseForm } from "@/components/admin/PurchaseForm";
import { addPurchase, listPurchases, suggestProductNames, type Purchase } from "@/lib/purchases/actions";

function currentMonthRange(): { from: string; to: string } {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const monthStr = String(month + 1).padStart(2, "0");

  return {
    from: `${year}-${monthStr}-01`,
    to: `${year}-${monthStr}-${String(lastDay).padStart(2, "0")}`,
  };
}

function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export default function ComprasPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  async function reload() {
    const { from, to } = currentMonthRange();
    const result = await listPurchases(from, to);
    setPurchases(result);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleSubmit(purchase: {
    date: string;
    items: { productName: string; quantity: string; value: number }[];
    photo?: File;
  }) {
    await addPurchase(purchase.date, purchase.items, purchase.photo);
    await reload();
  }

  return (
    <div>
      <h1>Compras de mercado</h1>
      <PurchaseForm onSubmit={handleSubmit} onSearchProduct={suggestProductNames} />

      <h2>Compras do mês</h2>
      <ul>
        {purchases.map((purchase) => (
          <li key={purchase.id}>
            {purchase.date} — {formatBRL(purchase.total)} — {purchase.items.length} item(ns)
          </li>
        ))}
      </ul>
    </div>
  );
}
