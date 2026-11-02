import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { createSale } from "./actions";
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
  await admin.from("sales").delete().in("id", createdSaleIds);
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
});
