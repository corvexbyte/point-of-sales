// app/(dashboard)/categories/page.tsx
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CategoriesClient from "@/components/categories/CategoriesClient";

export const metadata = { title: "Kategori - POS System" };

export default async function CategoriesPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/cashier");

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("created_at", { ascending: false });

  return <CategoriesClient categories={categories ?? []} />;
}
