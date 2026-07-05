// app/(dashboard)/inventory/page.tsx
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InventoryClient from "@/components/inventory/InventoryClient";

export const metadata = { title: "Kelola Inventori - POS System" };

export default async function InventoryPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/cashier");

  // Fetch products, suppliers, and movement history
  const [
    { data: products },
    { data: suppliers },
    { data: movements },
  ] = await Promise.all([
    supabase.from("products").select("id, name, stock, sku").eq("is_active", true).order("name"),
    supabase.from("suppliers").select("id, name").order("name"),
    supabase
      .from("inventory_movements")
      .select("*, products(name, sku), suppliers(name), profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(150),
  ]);

  return (
    <InventoryClient
      products={products ?? []}
      suppliers={suppliers ?? []}
      initialMovements={movements ?? []}
      currentUserId={user.id}
    />
  );
}
