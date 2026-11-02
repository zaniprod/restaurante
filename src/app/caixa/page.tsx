"use client";

import { useEffect, useState } from "react";
import { Cart } from "@/components/caixa/Cart";
import { MenuGrid } from "@/components/caixa/MenuGrid";
import { PaymentForm } from "@/components/caixa/PaymentForm";
import { addItem, addManualValueLine, cartTotalCents, removeLine, type CartLine, type MenuItem } from "@/lib/pos/cart";
import type { PaymentEntry } from "@/lib/pos/payments";
import { createSale, getMenuItems } from "@/lib/sales/actions";

export default function CaixaPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  useEffect(() => {
    getMenuItems().then(setItems);
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
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <MenuGrid items={items} onSelect={handleSelect} />
      <Cart lines={cart} onRemove={handleRemove} />
      <fieldset disabled={submitting}>
        <PaymentForm totalCents={cartTotalCents(cart)} onConfirm={handleConfirm} />
      </fieldset>
      {confirmation && <p role="status">{confirmation}</p>}
    </div>
  );
}
