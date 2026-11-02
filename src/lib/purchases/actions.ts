"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";

export type PurchaseItemInput = { productName: string; quantity: string; value: number };

export type Purchase = {
  id: string;
  date: string;
  total: number;
  photoUrl: string | null;
  items: PurchaseItemInput[];
};

export async function addPurchase(
  date: string,
  items: PurchaseItemInput[],
  photo?: File,
  client?: SupabaseClient,
): Promise<void> {
  const supabase = client ?? (await createServerClient());

  let photoUrl: string | null = null;

  if (photo) {
    const path = `${date}-${crypto.randomUUID()}-${photo.name}`;
    const { error: uploadError } = await supabase.storage.from("notas-fiscais").upload(path, photo);
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("notas-fiscais").getPublicUrl(path);
    photoUrl = data.publicUrl;
  }

  const total = items.reduce((sum, item) => sum + item.value, 0);

  const { data: purchase, error: purchaseError } = await supabase
    .from("purchases")
    .insert({ date, total, photo_url: photoUrl })
    .select("id")
    .single();

  if (purchaseError) throw purchaseError;

  const { error: itemsError } = await supabase.from("purchase_items").insert(
    items.map((item) => ({
      purchase_id: purchase.id,
      product_name: item.productName,
      quantity: item.quantity,
      value: item.value,
    })),
  );

  if (itemsError) throw itemsError;
}

export async function listPurchases(
  fromDate: string,
  toDate: string,
  client?: SupabaseClient,
): Promise<Purchase[]> {
  const supabase = client ?? (await createServerClient());

  const { data, error } = await supabase
    .from("purchases")
    .select("id, date, total, photo_url, purchase_items(product_name, quantity, value)")
    .gte("date", fromDate)
    .lte("date", toDate)
    .order("date", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    date: row.date,
    total: row.total,
    photoUrl: row.photo_url,
    items: (row.purchase_items ?? []).map((item) => ({
      productName: item.product_name,
      quantity: item.quantity,
      value: item.value,
    })),
  }));
}

export async function suggestProductNames(query: string, client?: SupabaseClient): Promise<string[]> {
  const supabase = client ?? (await createServerClient());

  let request = supabase.from("purchase_items").select("product_name");
  if (query !== "") {
    request = request.ilike("product_name", `%${query}%`);
  }

  const { data, error } = await request;
  if (error) throw error;

  return Array.from(new Set((data ?? []).map((row) => row.product_name)));
}
