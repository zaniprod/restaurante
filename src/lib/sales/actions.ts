"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CartLine, MenuItem } from "@/lib/pos/cart";
import { validatePayments, type PaymentEntry, type PaymentMethod } from "@/lib/pos/payments";
import { createServerClient } from "@/lib/supabase/server";
import { brazilDayEnd, brazilDayStart } from "@/lib/date";

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

function toRpcItems(lines: CartLine[]) {
  return lines.map((line) => ({
    // An edited sale's line may have lost its original menu_item_id (e.g. "" from a UI
    // fallback); the RPC casts this to ::uuid, which errors on "" but accepts null.
    menuItemId: line.menuItemId === "" ? null : line.menuItemId,
    name: line.name,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    lineTotal: line.lineTotal,
  }));
}

function toRpcPayments(payments: PaymentEntry[]) {
  return payments.map((payment) => ({
    method: payment.method,
    amount: payment.amount,
    cashReceived: payment.cashReceived ?? null,
  }));
}

// Server Actions are public endpoints — a client bug or a malicious direct call could send
// payments that don't match the cart. Validate here too, not just in the PaymentForm UI.
function assertPaymentsMatchTotal(lines: CartLine[], payments: PaymentEntry[]) {
  const total = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const totalCents = Math.round(total * 100);

  const result = validatePayments(payments, totalCents);
  if (!result.valid) {
    throw new Error(result.error ?? "Pagamento inválido.");
  }

  return total;
}

export async function createSale(
  lines: CartLine[],
  payments: PaymentEntry[],
  client?: SupabaseClient,
): Promise<{ id: string }> {
  const supabase = client ?? (await createServerClient());
  const total = assertPaymentsMatchTotal(lines, payments);
  const id = crypto.randomUUID();

  const { error } = await supabase.rpc("create_sale", {
    p_id: id,
    p_total: total,
    p_items: toRpcItems(lines),
    p_payments: toRpcPayments(payments),
  });

  if (error) throw error;

  return { id };
}

export async function editSale(
  saleId: string,
  lines: CartLine[],
  payments: PaymentEntry[],
  client?: SupabaseClient,
): Promise<void> {
  const supabase = client ?? (await createServerClient());
  const total = assertPaymentsMatchTotal(lines, payments);

  const { error } = await supabase.rpc("edit_sale", {
    p_sale_id: saleId,
    p_total: total,
    p_items: toRpcItems(lines),
    p_payments: toRpcPayments(payments),
  });

  if (error) throw error;
}

export async function cancelSale(saleId: string, client?: SupabaseClient): Promise<void> {
  const supabase = client ?? (await createServerClient());

  const { error } = await supabase.rpc("cancel_sale", { p_sale_id: saleId });
  if (error) throw error;
}

function mapSaleRow(row: {
  id: string;
  created_at: string;
  status: "completed" | "cancelled";
  total: number;
  edited: boolean;
  sale_items:
    | { menu_item_id: string | null; name: string; quantity: number; unit_price: number; line_total: number }[]
    | null;
  sale_payments: { method: PaymentMethod; amount: number; cash_received: number | null }[] | null;
}): SaleWithDetails {
  return {
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
  };
}

export async function listSalesByDate(date: string, client?: SupabaseClient): Promise<SaleWithDetails[]> {
  return listSalesBetween(date, date, client);
}

export async function listSalesBetween(
  fromDate: string,
  toDate: string,
  client?: SupabaseClient,
): Promise<SaleWithDetails[]> {
  const supabase = client ?? (await createServerClient());

  const { data, error } = await supabase
    .from("sales")
    .select(
      "id, created_at, status, total, edited, sale_items(menu_item_id, name, quantity, unit_price, line_total), sale_payments(method, amount, cash_received)",
    )
    .gte("created_at", brazilDayStart(fromDate))
    .lte("created_at", brazilDayEnd(toDate))
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map(mapSaleRow);
}
