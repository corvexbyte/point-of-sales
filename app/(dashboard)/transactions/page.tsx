// app/(dashboard)/transactions/page.tsx
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TransactionsClient from "@/components/transactions/TransactionsClient";

export const metadata = { title: "Transaksi - POS System" };

export default async function TransactionsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const query = supabase
    .from("transactions")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  // Cashier only sees their own
  if (profile?.role === "cashier") {
    query.eq("cashier_id", user.id);
  }

  const { data: transactions } = await query;

  return (
    <TransactionsClient
      transactions={transactions ?? []}
      userRole={profile?.role ?? "cashier"}
    />
  );
}
