// app/(dashboard)/reports/page.tsx
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ReportsClient from "@/components/reports/ReportsClient";

export const metadata = { title: "Laporan Toko - POS System" };

export default async function ReportsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/cashier");

  // Fetch all transactions and items for report aggregation
  const [
    { data: transactions },
    { data: products },
    { data: txItems },
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("*, profiles(full_name)")
      .eq("status", "completed")
      .order("created_at", { ascending: false }),
    supabase
      .from("products")
      .select("*, categories(name)")
      .eq("is_active", true)
      .order("stock", { ascending: true }),
    supabase
      .from("transaction_items")
      .select("*, transactions(created_at, status)"),
  ]);

  // Clean items data to only active completed transactions
  const activeTxItems = (txItems ?? []).filter(
    (item) => item.transactions?.status === "completed"
  );

  return (
    <ReportsClient
      transactions={transactions ?? []}
      products={products ?? []}
      transactionItems={activeTxItems}
    />
  );
}
