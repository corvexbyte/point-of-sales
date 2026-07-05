// app/(dashboard)/audit/page.tsx
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AuditClient from "@/components/audit/AuditClient";

export const metadata = { title: "Audit Log Aktivitas - POS System" };

export default async function AuditPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/cashier");

  // Fetch all audit logs
  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(200);

  return <AuditClient initialLogs={logs ?? []} />;
}
