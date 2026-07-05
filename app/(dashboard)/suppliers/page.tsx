// app/(dashboard)/suppliers/page.tsx
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SuppliersClient from "@/components/suppliers/SuppliersClient";

export const metadata = { title: "Kelola Supplier - POS System" };

export default async function SuppliersPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/cashier");

  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("*")
    .order("name");

  return <SuppliersClient initialSuppliers={suppliers ?? []} />;
}
