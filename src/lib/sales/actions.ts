"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CartLine, MenuItem } from "@/lib/pos/cart";
import type { PaymentEntry, PaymentMethod } from "@/lib/pos/payments";
import { createServerClient } from "@/lib/supabase/server";

export type SaleWithDetails = {
  id: string;
  createdAt: string;
  status: "completed" | "cancelled";
  total: number;
  edited: boolean;
  items: { menuItemId: string | null; name: string; quantity: number; unitPrice: number; lineTotal: number }[];
  payments: { method: PaymentMethod; amount: number; cashReceived: number | null }[];
};

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

async function snapshotSale(supabase: SupabaseClient, saleId: string) {
  const { data: sale, error: saleError } = await supabase.from("sales").select("*").eq("id", saleId).single();
  if (saleError) throw saleError;

  const { data: items, error: itemsError } = await supabase.from("sale_items").select("*").eq("sale_id", saleId);
  if (itemsError) throw itemsError;

  const { data: payments, error: paymentsError } = await supabase
    .from("sale_payments")
    .select("*")
    .eq("sale_id", saleId);
  if (paymentsError) throw paymentsError;

  const { error: insertError } = await supabase
    .from("sale_edits")
    .insert({ sale_id: saleId, snapshot: { sale, items, payments } });
  if (insertError) throw insertError;
}

export async function editSale(
  saleId: string,
  lines: CartLine[],
  payments: PaymentEntry[],
  client?: SupabaseClient,
): Promise<void> {
  const supabase = client ?? (await createServerClient());

  await snapshotSale(supabase, saleId);

  const total = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  const { error: updateError } = await supabase.from("sales").update({ total, edited: true }).eq("id", saleId);
  if (updateError) throw updateError;

  const { error: deleteItemsError } = await supabase.from("sale_items").delete().eq("sale_id", saleId);
  if (deleteItemsError) throw deleteItemsError;

  const { error: insertItemsError } = await supabase.from("sale_items").insert(
    lines.map((line) => ({
      sale_id: saleId,
      menu_item_id: line.menuItemId,
      name: line.name,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      line_total: line.lineTotal,
    })),
  );
  if (insertItemsError) throw insertItemsError;

  const { error: deletePaymentsError } = await supabase.from("sale_payments").delete().eq("sale_id", saleId);
  if (deletePaymentsError) throw deletePaymentsError;

  const { error: insertPaymentsError } = await supabase.from("sale_payments").insert(
    payments.map((payment) => ({
      sale_id: saleId,
      method: payment.method,
      amount: payment.amount,
      cash_received: payment.cashReceived ?? null,
      change_given: payment.cashReceived != null ? payment.cashReceived - payment.amount : null,
    })),
  );
  if (insertPaymentsError) throw insertPaymentsError;
}

export async function cancelSale(saleId: string, client?: SupabaseClient): Promise<void> {
  const supabase = client ?? (await createServerClient());

  await snapshotSale(supabase, saleId);

  const { error } = await supabase.from("sales").update({ status: "cancelled" }).eq("id", saleId);
  if (error) throw error;
}

export async function listSalesByDate(date: string, client?: SupabaseClient): Promise<SaleWithDetails[]> {
  const supabase = client ?? (await createServerClient());

  const { data, error } = await supabase
    .from("sales")
    .select(
      "id, created_at, status, total, edited, sale_items(menu_item_id, name, quantity, unit_price, line_total), sale_payments(method, amount, cash_received)",
    )
    .gte("created_at", `${date}T00:00:00.000Z`)
    .lte("created_at", `${date}T23:59:59.999Z`)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    status: row.status,
    total: row.total,
    edited: row.edited,
    items: (row.sale_items ?? []).map((item) => ({
      menuItemId: item.menu_item_id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      lineTotal: item.line_total,
    })),
    payments: (row.sale_payments ?? []).map((payment) => ({
      method: payment.method,
      amount: payment.amount,
      cashReceived: payment.cash_received,
    })),
  }));
}
