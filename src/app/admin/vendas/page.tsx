"use client";

import { useEffect, useState } from "react";
import { SalesList } from "@/components/admin/SalesList";
import { Cart } from "@/components/caixa/Cart";
import { PaymentForm } from "@/components/caixa/PaymentForm";
import { cartTotalCents, removeLine, type CartLine } from "@/lib/pos/cart";
import type { PaymentEntry } from "@/lib/pos/payments";
import { cancelSale, editSale, listSalesByDate, type SaleWithDetails } from "@/lib/sales/actions";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function VendasPage() {
  const [date, setDate] = useState(todayStr());
  const [sales, setSales] = useState<SaleWithDetails[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCart, setEditCart] = useState<CartLine[]>([]);

  async function reload() {
    const result = await listSalesByDate(date);
    setSales(result);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  function startEdit(id: string) {
    const sale = sales.find((s) => s.id === id);
    if (!sale) return;
    setEditingId(id);
    setEditCart(
      sale.items.map((item) => ({
        menuItemId: item.menuItemId ?? "",
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
    );
  }

  async function handleEditConfirm(payments: PaymentEntry[]) {
    if (!editingId) return;
    await editSale(editingId, editCart, payments);
    setEditingId(null);
    setEditCart([]);
    await reload();
  }

  async function handleCancel(id: string) {
    if (!window.confirm("Cancelar esta venda?")) return;
    await cancelSale(id);
    await reload();
  }

  return (
    <div>
      <label htmlFor="data">Data</label>
      <input id="data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

      <SalesList sales={sales} onEdit={startEdit} onCancel={handleCancel} />

      {editingId && (
        <div>
          <Cart lines={editCart} onRemove={(index) => setEditCart((current) => removeLine(current, index))} />
          <PaymentForm totalCents={cartTotalCents(editCart)} onConfirm={handleEditConfirm} />
        </div>
      )}
    </div>
  );
}
