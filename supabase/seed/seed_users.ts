// One-off script: creates the auth.users accounts this app needs and their matching
// profiles rows. Run once per environment with `npx tsx supabase/seed/seed_users.ts`.
//
// Required env vars (read from .env.local via dotenv):
//   NEXT_PUBLIC_SUPABASE_URL   — the project URL
//   SUPABASE_SECRET_KEY        — the project's secret API key (admin-equivalent; never expose client-side)
//   SEED_OPERADOR_EMAIL / SEED_OPERADOR_PASSWORD — shared cashier login
//   SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD / SEED_ADMIN_NAME — the admin login
//
// Only one admin account is seeded by design: the restaurant owner's mother opted out
// of having her own login and uses the admin's account instead (confirmed with the user
// during Task 2). profiles.role still supports adding a second 'admin' row later if that changes.

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !secretKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in the environment.");
}

const supabase = createClient(url, secretKey);

type SeedUser = { email: string; password: string; role: "operador" | "admin"; name: string };

const users: SeedUser[] = [
  {
    email: process.env.SEED_OPERADOR_EMAIL!,
    password: process.env.SEED_OPERADOR_PASSWORD!,
    role: "operador",
    name: "Caixa",
  },
  {
    email: process.env.SEED_ADMIN_EMAIL!,
    password: process.env.SEED_ADMIN_PASSWORD!,
    role: "admin",
    name: process.env.SEED_ADMIN_NAME ?? "Admin",
  },
];

async function main() {
  for (const user of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    });

    if (error) {
      throw new Error(`Failed to create auth user ${user.email}: ${error.message}`);
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .insert({ id: data.user.id, role: user.role, name: user.name });

    if (profileError) {
      throw new Error(`Failed to create profile for ${user.email}: ${profileError.message}`);
    }

    console.log(`Created ${user.role} user: ${user.email}`);
  }
}

main();
