"use client";

import { useEffect, useState } from "react";
import { SalesList } from "@/components/admin/SalesList";
import { Cart } from "@/components/caixa/Cart";
import { MenuGrid } from "@/components/caixa/MenuGrid";
import { PaymentForm } from "@/components/caixa/PaymentForm";
import { addItem, addManualValueLine, cartTotalCents, removeLine, type CartLine, type MenuItem } from "@/lib/pos/cart";
import type { PaymentEntry } from "@/lib/pos/payments";
import { cancelSale, editSale, getMenuItems, listSalesByDate, type SaleWithDetails } from "@/lib/sales/actions";
import { todayInBrazil } from "@/lib/date";

export default function VendasPage() {
  const [date, setDate] = useState(todayInBrazil());
  const [sales, setSales] = useState<SaleWithDetails[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCart, setEditCart] = useState<CartLine[]>([]);
  const [editPayments, setEditPayments] = useState<PaymentEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const result = await listSalesByDate(date);
    setSales(result);
  }

  useEffect(() => {
    getMenuItems().then(setItems);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data reload when date changes
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  function startEdit(id: string) {
    const sale = sales.find((s) => s.id === id);
    if (!sale) return;
    setEditingId(id);
    setError(null);
    setEditCart(
      sale.items.map((item) => ({
        menuItemId: item.menuItemId ?? "",
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })),
    );
    setEditPayments(sale.payments.map((p) => ({ method: p.method, amount: p.amount, cashReceived: p.cashReceived ?? undefined })));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditCart([]);
    setEditPayments([]);
  }

  function handleEditSelect(item: MenuItem, manualValue?: number) {
    setEditCart((current) =>
      manualValue !== undefined ? addManualValueLine(current, item, manualValue) : addItem(current, item),
    );
  }

  async function handleEditConfirm(payments: PaymentEntry[]) {
    if (!editingId) return;
    try {
      await editSale(editingId, editCart, payments);
      cancelEdit();
      await reload();
    } catch {
      setError("Não foi possível salvar a edição. Verifique a conexão e tente novamente.");
    }
  }

  async function handleCancel(id: string) {
    if (!window.confirm("Cancelar esta venda?")) return;
    try {
      await cancelSale(id);
      await reload();
    } catch {
      setError("Não foi possível cancelar a venda. Verifique a conexão e tente novamente.");
    }
  }

  return (
    <div>
      <label htmlFor="data">Data</label>
      <input id="data" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

      {error && <p role="alert">{error}</p>}

      <SalesList sales={sales} onEdit={startEdit} onCancel={handleCancel} />

      {editingId && (
        <div>
          <h3>Editando venda</h3>
          <MenuGrid items={items} onSelect={handleEditSelect} />
          <Cart lines={editCart} onRemove={(index) => setEditCart((current) => removeLine(current, index))} />
          <PaymentForm
            totalCents={cartTotalCents(editCart)}
            onConfirm={handleEditConfirm}
            initialPayments={editPayments}
          />
          <button type="button" onClick={cancelEdit}>
            Cancelar edição
          </button>
        </div>
      )}
    </div>
  );
}
