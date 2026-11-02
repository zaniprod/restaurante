import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, test } from "vitest";
import { addPurchase, deletePurchase, getPurchasePhotoUrl, listPurchases, suggestProductNames } from "./actions";
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

// Cleanup is id-based, never date-based: deleting "every purchase on this date" would be
// destructive once the restaurant has real data, even on a date that looks safely in the
// past when the test was written. Test dates are also fixed to 2000, matching the
// obviously-fake date convention already used in sales/actions.test.ts.
const createdPurchaseIds: string[] = [];

afterEach(async () => {
  if (createdPurchaseIds.length === 0) return;
  const admin = createClient(url, secretKey, { auth: { persistSession: false } });
  await admin.from("purchases").delete().in("id", createdPurchaseIds);
  createdPurchaseIds.length = 0;
});

describe("addPurchase / listPurchases", () => {
  test("adding a purchase with two items creates one purchase row and two purchase_items rows", async () => {
    const client = await signInAsAdmin();
    const date = "2000-01-20";

    const items: PurchaseItemInput[] = [
      { productName: "Tomate", quantity: "3kg", value: 15 },
      { productName: "Alface", quantity: "2un", value: 8 },
    ];

    await addPurchase(date, items, undefined, client);

    const results = await listPurchases(date, date, client);
    expect(results).toHaveLength(1);
    createdPurchaseIds.push(results[0].id);

    expect(results[0].total).toBe(23);
    expect(results[0].items).toHaveLength(2);
    expect(results[0].items.map((i) => i.productName)).toEqual(["Tomate", "Alface"]);
  });

  test("adding a purchase signed in as the operador is rejected by RLS", async () => {
    const client = await signInAsOperador();

    await expect(
      addPurchase("2000-01-21", [{ productName: "Deveria falhar", quantity: "1", value: 1 }], undefined, client),
    ).rejects.toThrow();
  });
});

describe("addPurchase with a photo", () => {
  test("stores a sanitized storage path (not a broken public URL on a private bucket), and getPurchasePhotoUrl returns a working signed URL", async () => {
    const client = await signInAsAdmin();
    const date = "2000-01-24";
    const photo = new File(["conteúdo da nota"], "nota fiscal (1).jpg", { type: "image/jpeg" });

    await addPurchase(date, [{ productName: "Tomate", quantity: "1kg", value: 5 }], photo, client);

    const [inserted] = await listPurchases(date, date, client);
    createdPurchaseIds.push(inserted.id);

    expect(inserted.photoPath).toBeTruthy();
    expect(inserted.photoPath).not.toContain(" ");

    const url = await getPurchasePhotoUrl(inserted.photoPath!, client);
    expect(url).toMatch(/^https?:\/\//);
  });
});

describe("deletePurchase", () => {
  test("an admin can delete a mistaken purchase, removing it from listPurchases", async () => {
    const client = await signInAsAdmin();
    const date = "2000-01-23";

    await addPurchase(date, [{ productName: "Erro", quantity: "1", value: 999 }], undefined, client);
    const [inserted] = await listPurchases(date, date, client);

    await deletePurchase(inserted.id, client);

    const after = await listPurchases(date, date, client);
    expect(after.map((p) => p.id)).not.toContain(inserted.id);
  });
});

describe("suggestProductNames", () => {
  test("returns past product names matching the query", async () => {
    const client = await signInAsAdmin();
    const date = "2000-01-22";

    await addPurchase(
      date,
      [
        { productName: "Tomate", quantity: "1kg", value: 5 },
        { productName: "Alface", quantity: "1un", value: 3 },
      ],
      undefined,
      client,
    );

    const [inserted] = await listPurchases(date, date, client);
    createdPurchaseIds.push(inserted.id);

    const matches = await suggestProductNames("Tom", client);
    expect(matches).toContain("Tomate");
    expect(matches).not.toContain("Alface");
  });
});
