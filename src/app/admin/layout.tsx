import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
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

  if (profile?.role === "operador") {
    redirect("/caixa");
  }

  if (profile?.role !== "admin") {
    redirect("/login");
  }

  return (
    <>
      <AdminNav />
      {children}
    </>
  );
}
