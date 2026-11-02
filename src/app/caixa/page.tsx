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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";

export default function CaixaPage() {
  const router = useRouter();
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

  async function handleLogout() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <p className="font-serif text-xl text-ink">
          Calçadão <span className="text-ink-soft">· Caixa</span>
        </p>
        <nav className="flex items-center gap-5 text-sm text-ink-soft">
          <Link href="/admin" className="hover:text-ink">
            Painel admin
          </Link>
          <button type="button" onClick={handleLogout} className="hover:text-rust">
            Sair
          </button>
        </nav>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[1fr_380px]">
        <div>
          <MenuGrid items={items} onSelect={handleSelect} />
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="border border-line bg-white/40 p-4">
            <h2 className="mb-3 font-serif text-lg text-ink">Comanda</h2>
            <Cart lines={cart} onRemove={handleRemove} />

            <div className="mt-4">
              <fieldset disabled={submitting} className="contents">
                <PaymentForm key={saleFormKey} totalCents={cartTotalCents(cart)} onConfirm={handleConfirm} />
              </fieldset>
            </div>

            {confirmation && (
              <p role="status" className="mt-3 text-sm text-green">
                {confirmation}
              </p>
            )}
            {error && (
              <p role="alert" className="mt-3 text-sm text-rust">
                {error}
              </p>
            )}
          </div>
        </aside>
      </div>

      <div className="mx-auto max-w-6xl border-t border-line px-6 py-8">
        <h2 className="mb-3 font-serif text-lg text-ink">Vendas de hoje</h2>
        <SalesList sales={todaySales} onEdit={startEdit} onCancel={handleCancel} />
      </div>

      {editingId && (
        <div className="mx-auto max-w-6xl border-t-2 border-green px-6 py-8">
          <h3 className="mb-4 font-serif text-lg text-ink">Editando venda</h3>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
            <MenuGrid items={items} onSelect={handleEditSelect} />
            <div className="border border-line bg-white/40 p-4">
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
