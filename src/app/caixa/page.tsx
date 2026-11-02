"use client";

import { useEffect, useState } from "react";
import { SalesList } from "@/components/admin/SalesList";
import { Cart } from "@/components/caixa/Cart";
import { MenuGrid } from "@/components/caixa/MenuGrid";
import { PaymentForm } from "@/components/caixa/PaymentForm";
import { addItem, addManualValueLine, cartTotalCents, removeLine, type CartLine, type MenuItem } from "@/lib/pos/cart";
import type { PaymentEntry } from "@/lib/pos/payments";
import { cancelSale, createSale, editSale, getMenuItems, listSalesByDate, type SaleWithDetails } from "@/lib/sales/actions";
import { todayInBrazil } from "@/lib/date";

export default function CaixaPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saleFormKey, setSaleFormKey] = useState(0);

  const [todaySales, setTodaySales] = useState<SaleWithDetails[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCart, setEditCart] = useState<CartLine[]>([]);
  const [editPayments, setEditPayments] = useState<PaymentEntry[]>([]);

  async function reloadToday() {
    const result = await listSalesByDate(todayInBrazil());
    setTodaySales(result);
  }

  useEffect(() => {
    getMenuItems().then(setItems);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load on mount
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
    if (cart.length === 0) {
      setError("Adicione ao menos um item antes de finalizar a venda.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createSale(cart, payments);
      setCart([]);
      setConfirmation("Venda registrada com sucesso.");
      setSaleFormKey((key) => key + 1);
      await reloadToday();
    } catch {
      setError("Não foi possível registrar a venda. Verifique a conexão e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(id: string) {
    const sale = todaySales.find((s) => s.id === id);
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
      await reloadToday();
    } catch {
      setError("Não foi possível salvar a edição. Verifique a conexão e tente novamente.");
    }
  }

  async function handleCancel(id: string) {
    if (!window.confirm("Cancelar esta venda?")) return;
    try {
      await cancelSale(id);
      await reloadToday();
    } catch {
      setError("Não foi possível cancelar a venda. Verifique a conexão e tente novamente.");
    }
  }

  return (
    <div>
      <MenuGrid items={items} onSelect={handleSelect} />
      <Cart lines={cart} onRemove={handleRemove} />
      <fieldset disabled={submitting}>
        <PaymentForm key={saleFormKey} totalCents={cartTotalCents(cart)} onConfirm={handleConfirm} />
      </fieldset>
      {confirmation && <p role="status">{confirmation}</p>}
      {error && <p role="alert">{error}</p>}

      <h2>Vendas de hoje</h2>
      <SalesList sales={todaySales} onEdit={startEdit} onCancel={handleCancel} />

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
