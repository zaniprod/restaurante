"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";

export function AdminNav() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <nav>
      <Link href="/admin">Faturamento</Link> | <Link href="/admin/vendas">Vendas</Link> |{" "}
      <Link href="/admin/despesas">Despesas</Link> | <Link href="/admin/compras">Compras</Link> |{" "}
      <Link href="/admin/balanco">Balanço</Link> |{" "}
      <button type="button" onClick={handleLogout}>
        Sair
      </button>
    </nav>
  );
}
