import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, test } from "vitest";
import { addExpense, listExpenses } from "./actions";

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

const insertedDescriptions: string[] = [];

afterEach(async () => {
  if (insertedDescriptions.length === 0) return;
  const admin = createClient(url, secretKey, { auth: { persistSession: false } });
  await admin.from("expenses").delete().in("description", insertedDescriptions);
  insertedDescriptions.length = 0;
});

describe("addExpense / listExpenses", () => {
  test("an added expense appears in a range that includes its date, and is absent from one that excludes it", async () => {
    const client = await signInAsAdmin();
    const description = `Aluguel teste ${Date.now()}`;
    insertedDescriptions.push(description);

    await addExpense("2026-11-15", description, 1500, client);

    const included = await listExpenses("2026-11-01", "2026-11-30", client);
    expect(included.map((e) => e.description)).toContain(description);

    const excluded = await listExpenses("2026-10-01", "2026-10-31", client);
    expect(excluded.map((e) => e.description)).not.toContain(description);
  });

  test("adding an expense signed in as the operador is rejected by RLS", async () => {
    const client = await signInAsOperador();

    await expect(addExpense("2026-11-15", "Deveria falhar", 10, client)).rejects.toThrow();
  });
});
