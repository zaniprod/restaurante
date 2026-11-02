"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const supabase = createBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : "Não foi possível entrar. Verifique a conexão e tente novamente.",
      );
      return;
    }

    router.push("/");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="font-serif text-3xl text-ink">Calçadão</p>
        <p className="mb-8 text-ink-soft">Café e Restaurante</p>

        <form onSubmit={handleSubmit} className="space-y-5 border-t border-line pt-6">
          <div>
            <label htmlFor="email" className="block text-sm text-ink-soft">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-line bg-white/60 px-3 py-2 text-ink outline-none focus:border-green"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-ink-soft">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-line bg-white/60 px-3 py-2 text-ink outline-none focus:border-green"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-rust">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-green py-3 font-medium text-paper transition-colors hover:bg-green-dark"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
