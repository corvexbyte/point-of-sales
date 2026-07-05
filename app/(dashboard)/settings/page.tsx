// app/(dashboard)/settings/page.tsx
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsClient from "@/components/settings/SettingsClient";

export const metadata = { title: "Pengaturan Toko - POS System" };

export default async function SettingsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/cashier");

  // Fetch settings (first row)
  const { data: settings } = await supabase
    .from("settings")
    .select("*")
    .limit(1)
    .single();

  return <SettingsClient initialSettings={settings} />;
}
