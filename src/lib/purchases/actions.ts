"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";

export type PurchaseItemInput = { productName: string; quantity: string; value: number };

export type Purchase = {
  id: string;
  date: string;
  total: number;
  photoPath: string | null;
  items: PurchaseItemInput[];
};

// The "notas-fiscais" bucket is private (admin-only), so a public URL never resolves —
// store the storage path and mint a short-lived signed URL only when actually viewing one.
function sanitizeFileName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9.]+/g, "-");
}

export async function addPurchase(
  date: string,
  items: PurchaseItemInput[],
  photo?: File,
  client?: SupabaseClient,
): Promise<void> {
  const supabase = client ?? (await createServerClient());

  let photoPath: string | null = null;

  if (photo) {
    const path = `${date}-${crypto.randomUUID()}-${sanitizeFileName(photo.name)}`;
    const buffer = await photo.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("notas-fiscais")
      .upload(path, buffer, { contentType: photo.type });
    if (uploadError) throw uploadError;

    photoPath = path;
  }

  const total = items.reduce((sum, item) => sum + item.value, 0);

  const { data: purchase, error: purchaseError } = await supabase
    .from("purchases")
    .insert({ date, total, photo_url: photoPath })
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
    photoPath: row.photo_url,
    items: (row.purchase_items ?? []).map((item) => ({
      productName: item.product_name,
      quantity: item.quantity,
      value: item.value,
    })),
  }));
}

export async function getPurchasePhotoUrl(path: string, client?: SupabaseClient): Promise<string> {
  const supabase = client ?? (await createServerClient());

  const { data, error } = await supabase.storage.from("notas-fiscais").createSignedUrl(path, 60 * 60);
  if (error) throw error;

  return data.signedUrl;
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

export async function deletePurchase(id: string, client?: SupabaseClient): Promise<void> {
  const supabase = client ?? (await createServerClient());

  // purchase_items has `on delete cascade` on its FK, so this removes the line items too.
  const { error } = await supabase.from("purchases").delete().eq("id", id);

  if (error) throw error;
}
