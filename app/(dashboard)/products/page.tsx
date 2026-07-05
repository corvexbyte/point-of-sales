// app/(dashboard)/products/page.tsx
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProductsClient from "@/components/products/ProductsClient";

export const metadata = { title: "Produk - POS System" };

export default async function ProductsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/cashier");

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("*, categories(name)")
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("*").order("name"),
  ]);

  return (
    <ProductsClient products={products ?? []} categories={categories ?? []} />
  );
}
