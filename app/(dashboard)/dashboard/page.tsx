// app/(dashboard)/dashboard/page.tsx
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "@/components/dashboard/DashboardClient";

export const metadata = { title: "Dashboard - POS System" };

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/cashier");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    { data: todayTx },
    { data: allTx },
    { data: products },
    { data: recentTx },
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("total_amount")
      .eq("status", "completed")
      .gte("created_at", today.toISOString()),
    supabase
      .from("transactions")
      .select("total_amount")
      .eq("status", "completed"),
    supabase.from("products").select("id, stock, min_stock").eq("is_active", true),
    supabase
      .from("transactions")
      .select("*, profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const todayRevenue = (todayTx ?? []).reduce((s, t) => s + t.total_amount, 0);
  const totalRevenue = (allTx ?? []).reduce((s, t) => s + t.total_amount, 0);
  const lowStockCount = (products ?? []).filter((p) => p.stock <= (p.min_stock ?? 5)).length;
  const totalProducts = (products ?? []).length;

  return (
    <DashboardClient
      todayRevenue={todayRevenue}
      totalRevenue={totalRevenue}
      todayTransactions={todayTx?.length ?? 0}
      totalProducts={totalProducts}
      lowStockCount={lowStockCount}
      recentTransactions={(recentTx as any[]) ?? []}
    />
  );
}
