"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";

export type Expense = { id: string; date: string; description: string; amount: number };

export async function listExpenses(
  fromDate: string,
  toDate: string,
  client?: SupabaseClient,
): Promise<Expense[]> {
  const supabase = client ?? (await createServerClient());

  const { data, error } = await supabase
    .from("expenses")
    .select("id, date, description, amount")
    .gte("date", fromDate)
    .lte("date", toDate)
    .order("date", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

export async function addExpense(
  date: string,
  description: string,
  amount: number,
  client?: SupabaseClient,
): Promise<void> {
  const supabase = client ?? (await createServerClient());

  const { error } = await supabase.from("expenses").insert({ date, description, amount });

  if (error) throw error;
}

export async function deleteExpense(id: string, client?: SupabaseClient): Promise<void> {
  const supabase = client ?? (await createServerClient());

  const { error } = await supabase.from("expenses").delete().eq("id", id);

  if (error) throw error;
}
