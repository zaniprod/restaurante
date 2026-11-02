"use client";

import { useEffect, useState } from "react";
import { SalesList } from "@/components/admin/SalesList";
import { Cart } from "@/components/caixa/Cart";
import { MenuGrid } from "@/components/caixa/MenuGrid";
import { PaymentForm } from "@/components/caixa/PaymentForm";
import { addItem, addManualValueLine, cartTotalCents, removeLine, type CartLine, type MenuItem } from "@/lib/pos/cart";
import type { PaymentEntry } from "@/lib/pos/payments";
import { cancelSale, createSale, editSale, getMenuItems, listSalesByDate, type SaleWithDetails } from "@/lib/sales/actions";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function CaixaPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const [todaySales, setTodaySales] = useState<SaleWithDetails[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCart, setEditCart] = useState<CartLine[]>([]);

  async function reloadToday() {
    const result = await listSalesByDate(todayStr());
    setTodaySales(result);
  }

  useEffect(() => {
    getMenuItems().then(setItems);
    reloadToday();
  }, []);

  function handleSelect(item: MenuItem, manualValue?: number) {
    setConfirmation(null);
    setCart((current) =>
      manualValue !== undefined ? addManualValueLine(current, item, manualValue) : addItem(current, item),
    );
  }

  function handleRemove(index: number) {
    setCart((current) => removeLine(current, index));
  }

  async function handleConfirm(payments: PaymentEntry[]) {
    setSubmitting(true);
    try {
      await createSale(cart, payments);
      setCart([]);
      setConfirmation("Venda registrada com sucesso.");
      await reloadToday();
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(id: string) {
    const sale = todaySales.find((s) => s.id === id);
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
    await reloadToday();
  }

  async function handleCancel(id: string) {
    if (!window.confirm("Cancelar esta venda?")) return;
    await cancelSale(id);
    await reloadToday();
  }

  return (
    <div>
      <MenuGrid items={items} onSelect={handleSelect} />
      <Cart lines={cart} onRemove={handleRemove} />
      <fieldset disabled={submitting}>
        <PaymentForm totalCents={cartTotalCents(cart)} onConfirm={handleConfirm} />
      </fieldset>
      {confirmation && <p role="status">{confirmation}</p>}

      <h2>Vendas de hoje</h2>
      <SalesList sales={todaySales} onEdit={startEdit} onCancel={handleCancel} />

      {editingId && (
        <div>
          <Cart lines={editCart} onRemove={(index) => setEditCart((current) => removeLine(current, index))} />
          <PaymentForm totalCents={cartTotalCents(editCart)} onConfirm={handleEditConfirm} />
        </div>
      )}
    </div>
  );
}
