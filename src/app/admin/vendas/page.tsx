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
      <div className="flex w-full flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-ink">Vendas</h1>
        <div>
          <label htmlFor="data" className="mr-2 text-sm text-ink-soft">
            Data
          </label>
          <input
            id="data"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-line bg-white/60 px-2 py-1 text-sm text-ink outline-none focus:border-green"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-rust">
          {error}
        </p>
      )}

      <div className="mt-6">
        <SalesList sales={sales} onEdit={startEdit} onCancel={handleCancel} />
      </div>

      {editingId && (
        <div className="mt-8 border-t-2 border-green pt-6">
          <h3 className="mb-4 font-serif text-lg text-ink">Editando venda</h3>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
            <MenuGrid items={items} onSelect={handleEditSelect} />
            <div className="rounded-lg border border-line bg-white/40 p-4">
              <Cart lines={editCart} onRemove={(index) => setEditCart((current) => removeLine(current, index))} />
              <div className="mt-4">
                <PaymentForm
                  totalCents={cartTotalCents(editCart)}
                  onConfirm={handleEditConfirm}
                  initialPayments={editPayments}
                />
              </div>
              <button
                type="button"
                onClick={cancelEdit}
                className="mt-3 text-sm text-ink-soft underline-offset-2 hover:underline"
              >
                Cancelar edição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
