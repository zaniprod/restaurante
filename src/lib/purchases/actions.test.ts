import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, test } from "vitest";
import { addPurchase, listPurchases, suggestProductNames } from "./actions";
import type { PurchaseItemInput } from "./actions";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const secretKey = process.env.SUPABASE_SECRET_KEY!;

async function signInAsAdmin(): Promise<SupabaseClient> {
  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({
    email: process.env.SEED_ADMIN_EMAIL!,
    password: process.env.SEED_ADMIN_PASSWORD!,
  });
  if (error) throw error;
  return client;
}

async function signInAsOperador(): Promise<SupabaseClient> {
  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({
    email: process.env.SEED_OPERADOR_EMAIL!,
    password: process.env.SEED_OPERADOR_PASSWORD!,
  });
  if (error) throw error;
  return client;
}

const createdPurchaseDates: string[] = [];

afterEach(async () => {
  if (createdPurchaseDates.length === 0) return;
  const admin = createClient(url, secretKey, { auth: { persistSession: false } });
  await admin.from("purchases").delete().in("date", createdPurchaseDates);
  createdPurchaseDates.length = 0;
});

describe("addPurchase / listPurchases", () => {
  test("adding a purchase with two items creates one purchase row and two purchase_items rows", async () => {
    const client = await signInAsAdmin();
    const date = "2026-11-20";
    createdPurchaseDates.push(date);

    const items: PurchaseItemInput[] = [
      { productName: "Tomate", quantity: "3kg", value: 15 },
      { productName: "Alface", quantity: "2un", value: 8 },
    ];

    await addPurchase(date, items, undefined, client);

    const results = await listPurchases(date, date, client);
    expect(results).toHaveLength(1);
    expect(results[0].total).toBe(23);
    expect(results[0].items).toHaveLength(2);
    expect(results[0].items.map((i) => i.productName)).toEqual(["Tomate", "Alface"]);
  });

  test("adding a purchase signed in as the operador is rejected by RLS", async () => {
    const client = await signInAsOperador();

    await expect(
      addPurchase("2026-11-21", [{ productName: "Deveria falhar", quantity: "1", value: 1 }], undefined, client),
    ).rejects.toThrow();
  });
});

describe("suggestProductNames", () => {
  test("returns past product names matching the query", async () => {
    const client = await signInAsAdmin();
    const date = "2026-11-22";
    createdPurchaseDates.push(date);

    await addPurchase(
      date,
      [
        { productName: "Tomate", quantity: "1kg", value: 5 },
        { productName: "Alface", quantity: "1un", value: 3 },
      ],
      undefined,
      client,
    );

    const matches = await suggestProductNames("Tom", client);
    expect(matches).toContain("Tomate");
    expect(matches).not.toContain("Alface");
  });
});
