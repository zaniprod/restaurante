"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/admin", label: "Faturamento" },
  { href: "/admin/vendas", label: "Vendas" },
  { href: "/admin/despesas", label: "Despesas" },
  { href: "/admin/compras", label: "Compras" },
  { href: "/admin/balanco", label: "Balanço" },
  { href: "/caixa", label: "Caixa" },
];

export function AdminNav() {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="border-b border-line px-6 py-4">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-y-3">
        <p className="font-serif text-xl text-ink">
          Calçadão <span className="text-ink-soft">· Admin</span>
        </p>

        <nav className="flex items-center gap-5 text-sm">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  active
                    ? "border-b-2 border-green pb-1 text-ink"
                    : "border-b-2 border-transparent pb-1 text-ink-soft hover:text-ink"
                }
              >
                {link.label}
              </Link>
            );
          })}
          <button type="button" onClick={handleLogout} className="text-ink-soft hover:text-rust">
            Sair
          </button>
        </nav>
      </div>
    </header>
  );
}
