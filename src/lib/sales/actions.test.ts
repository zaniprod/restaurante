import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { cancelSale, createSale, editSale, listSalesByDate } from "./actions";
import type { CartLine } from "@/lib/pos/cart";
import type { PaymentEntry } from "@/lib/pos/payments";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const secretKey = process.env.SUPABASE_SECRET_KEY!;

async function signInAsOperador(): Promise<SupabaseClient> {
  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({
    email: process.env.SEED_OPERADOR_EMAIL!,
    password: process.env.SEED_OPERADOR_PASSWORD!,
  });
  if (error) throw error;
  return client;
}

const createdSaleIds: string[] = [];

afterEach(async () => {
  if (createdSaleIds.length === 0) return;
  const admin = createClient(url, secretKey, { auth: { persistSession: false } });
  const { error } = await admin.from("sales").delete().in("id", createdSaleIds);
  // A silent cleanup failure here leaves real rows in the live project with nothing to
  // show for it — surface it instead of letting the suite report green over leaked data.
  if (error) throw new Error(`Test cleanup failed to delete sales ${createdSaleIds.join(", ")}: ${error.message}`);
  createdSaleIds.length = 0;
});

let lines: CartLine[];
const payments: PaymentEntry[] = [{ method: "dinheiro", amount: 12 }];

beforeAll(async () => {
  const admin = createClient(url, secretKey, { auth: { persistSession: false } });
  const { data: menuItems } = await admin
    .from("menu_items")
    .select("id, name, price")
    .in("name", ["Refrigerante Lata", "Água Mineral"]);

  const refrigerante = menuItems!.find((item) => item.name === "Refrigerante Lata")!;
  const agua = menuItems!.find((item) => item.name === "Água Mineral")!;

  lines = [
    { menuItemId: refrigerante.id, name: refrigerante.name, quantity: 1, unitPrice: refrigerante.price, lineTotal: refrigerante.price },
    { menuItemId: agua.id, name: agua.name, quantity: 1, unitPrice: agua.price, lineTotal: agua.price },
  ];
});

describe("createSale", () => {
  test("signed in as the operador, persists the sale, its items, and its payment", async () => {
    const client = await signInAsOperador();

    const { id } = await createSale(lines, payments, client);
    createdSaleIds.push(id);

    const { data: sale } = await client.from("sales").select("*").eq("id", id).single();
    expect(sale).toMatchObject({ status: "completed", total: 12 });

    const { data: saleItems } = await client.from("sale_items").select("*").eq("sale_id", id);
    expect(saleItems).toHaveLength(2);

    const { data: salePayments } = await client.from("sale_payments").select("*").eq("sale_id", id);
    expect(salePayments).toHaveLength(1);
    expect(salePayments?.[0]).toMatchObject({ method: "dinheiro", amount: 12 });
  });

  test("with no session, the insert is rejected by RLS", async () => {
    const anonClient = createClient(url, anonKey, { auth: { persistSession: false } });

    await expect(createSale(lines, payments, anonClient)).rejects.toThrow();
  });

  test("payments that don't sum to the cart total are rejected before touching the database", async () => {
    const client = await signInAsOperador();
    const mismatched: PaymentEntry[] = [{ method: "dinheiro", amount: 1 }];

    await expect(createSale(lines, mismatched, client)).rejects.toThrow();
  });
});

describe("editSale", () => {
  test("snapshots the prior state, applies the new lines/payments, and marks the sale edited", async () => {
    const client = await signInAsOperador();
    const { id } = await createSale(lines, payments, client);
    createdSaleIds.push(id);

    const newLines: CartLine[] = [
      { menuItemId: lines[0].menuItemId, name: lines[0].name, quantity: 2, unitPrice: lines[0].unitPrice, lineTotal: lines[0].unitPrice * 2 },
    ];
    const newPayments: PaymentEntry[] = [{ method: "pix", amount: newLines[0].lineTotal }];

    await editSale(id, newLines, newPayments, client);

    const { data: sale } = await client.from("sales").select("*").eq("id", id).single();
    expect(sale).toMatchObject({ edited: true, total: newLines[0].lineTotal });

    const { data: saleItems } = await client.from("sale_items").select("*").eq("sale_id", id);
    expect(saleItems).toHaveLength(1);
    expect(saleItems?.[0]).toMatchObject({ name: newLines[0].name, quantity: 2 });

    const { data: salePayments } = await client.from("sale_payments").select("*").eq("sale_id", id);
    expect(salePayments).toHaveLength(1);
    expect(salePayments?.[0]).toMatchObject({ method: "pix", amount: newLines[0].lineTotal });

    const { data: edits } = await client.from("sale_edits").select("*").eq("sale_id", id);
    expect(edits).toHaveLength(1);
    expect(edits?.[0].snapshot.items).toHaveLength(2);
    expect(edits?.[0].snapshot.payments).toHaveLength(1);
    expect(edits?.[0].snapshot.sale.total).toBe(12);
  });
});

describe("cancelSale", () => {
  test("marks the sale cancelled and snapshots the pre-cancel state, leaving items/payments untouched", async () => {
    const client = await signInAsOperador();
    const { id } = await createSale(lines, payments, client);
    createdSaleIds.push(id);

    await cancelSale(id, client);

    const { data: sale } = await client.from("sales").select("*").eq("id", id).single();
    expect(sale).toMatchObject({ status: "cancelled" });

    const { data: saleItems } = await client.from("sale_items").select("*").eq("sale_id", id);
    expect(saleItems).toHaveLength(2);

    const { data: edits } = await client.from("sale_edits").select("*").eq("sale_id", id);
    expect(edits).toHaveLength(1);
    expect(edits?.[0].snapshot.sale.status).toBe("completed");
  });
});

describe("listSalesByDate", () => {
  test("returns completed, edited, and cancelled sales for the date, excluding other dates", async () => {
    const client = await signInAsOperador();

    const { id: completedId } = await createSale(lines, payments, client);
    createdSaleIds.push(completedId);

    const { id: editedId } = await createSale(lines, payments, client);
    createdSaleIds.push(editedId);
    await editSale(editedId, lines, payments, client);

    const { id: cancelledId } = await createSale(lines, payments, client);
    createdSaleIds.push(cancelledId);
    await cancelSale(cancelledId, client);

    const admin = createClient(url, secretKey, { auth: { persistSession: false } });
    const { data: otherDaySale } = await admin
      .from("sales")
      .insert({ total: 1, status: "completed", created_at: "2000-01-01T00:00:00.000Z" })
      .select("id")
      .single();
    createdSaleIds.push(otherDaySale!.id);

    const today = new Date().toISOString().slice(0, 10);
    const results = await listSalesByDate(today, client);
    const resultIds = results.map((sale) => sale.id);

    expect(resultIds).toContain(completedId);
    expect(resultIds).toContain(editedId);
    expect(resultIds).toContain(cancelledId);
    expect(resultIds).not.toContain(otherDaySale!.id);

    expect(results.find((s) => s.id === completedId)).toMatchObject({ status: "completed", edited: false });
    expect(results.find((s) => s.id === editedId)).toMatchObject({ status: "completed", edited: true });
    expect(results.find((s) => s.id === cancelledId)).toMatchObject({ status: "cancelled" });
  });
});
