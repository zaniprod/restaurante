"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CartLine, MenuItem } from "@/lib/pos/cart";
import type { PaymentEntry } from "@/lib/pos/payments";
import { createServerClient } from "@/lib/supabase/server";

// `client` is an optional override so integration tests can pass an already-authenticated
// client instead of relying on createServerClient(), which needs a live Next.js request
// (next/headers) that a plain test process doesn't have. Production call sites omit it.
export async function getMenuItems(client?: SupabaseClient): Promise<MenuItem[]> {
  const supabase = client ?? (await createServerClient());

  const { data, error } = await supabase
    .from("menu_items")
    .select("id, category, name, price, manual_value")
    .eq("active", true);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    category: row.category,
    name: row.name,
    price: row.price,
    manualValue: row.manual_value,
  }));
}

export async function createSale(
  lines: CartLine[],
  payments: PaymentEntry[],
  client?: SupabaseClient,
): Promise<{ id: string }> {
  const supabase = client ?? (await createServerClient());

  const total = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({ total, status: "completed" })
    .select("id")
    .single();

  if (saleError) throw saleError;

  const { error: itemsError } = await supabase.from("sale_items").insert(
    lines.map((line) => ({
      sale_id: sale.id,
      menu_item_id: line.menuItemId,
      name: line.name,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      line_total: line.lineTotal,
    })),
  );

  if (itemsError) throw itemsError;

  const { error: paymentsError } = await supabase.from("sale_payments").insert(
    payments.map((payment) => ({
      sale_id: sale.id,
      method: payment.method,
      amount: payment.amount,
      cash_received: payment.cashReceived ?? null,
      change_given: payment.cashReceived != null ? payment.cashReceived - payment.amount : null,
    })),
  );

  if (paymentsError) throw paymentsError;

  return { id: sale.id };
}
