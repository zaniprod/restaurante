import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export default async function CaixaLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (profile?.role !== "operador" && profile?.role !== "admin") {
    redirect("/login");
  }

  return <>{children}</>;
}
