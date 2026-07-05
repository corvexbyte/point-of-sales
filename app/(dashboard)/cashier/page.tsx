// app/(dashboard)/cashier/page.tsx
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CashierClient from "@/components/cashier/CashierClient";
import type { Category, Product } from "@/types/pos.types";

export const metadata = { title: "Kasir - POS System" };

export default async function CashierPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("*, categories(name)")
      .eq("is_active", true)
      .order("name"),
    supabase.from("categories").select("*").order("name"),
  ]);

  return (
    <CashierClient
      products={(products as Product[]) ?? []}
      categories={(categories as Category[]) ?? []}
    />
  );
}
