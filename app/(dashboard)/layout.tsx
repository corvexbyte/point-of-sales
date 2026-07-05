// app/(dashboard)/layout.tsx
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Belum login → ke login
  if (error || !user) redirect("/login");

  // Cari profile user
  let { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  // Kalau profile belum ada (trigger belum jalan), buat manual
  if (!profile) {
    const { data: newProfile } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: user.email?.split("@")[0] ?? "User",
        role: "cashier",
      })
      .select("full_name, role")
      .single();
    profile = newProfile;
  }

  // Kalau masih gagal, tampilkan layout minimal tanpa crash
  const userName = profile?.full_name ?? user.email ?? "User";
  const userRole = (profile?.role ?? "cashier") as "admin" | "cashier";

  return (
    <div className="app-layout">
      <Sidebar userRole={userRole} userName={userName} />
      <main className="main-content">{children}</main>
    </div>
  );
}
