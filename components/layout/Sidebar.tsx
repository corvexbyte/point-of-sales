// components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingBag, ShoppingCart, Package, Tag,
  FileText, BarChart3, LogOut, User, ChevronRight,
  Users, Boxes, Truck, FilePieChart, Settings, ClipboardList, Database
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/pos.types";

interface SidebarProps { userRole: UserRole; userName: string; }

interface NavItem {
  href: string; label: string; icon: React.ReactNode;
  roles: UserRole[]; description?: string;
}

const navItems: NavItem[] = [
  { href: "/cashier", label: "Kasir", icon: <ShoppingCart size={18} />, roles: ["admin", "cashier"], description: "Proses transaksi" },
  { href: "/products", label: "Produk", icon: <Package size={18} />, roles: ["admin"], description: "Data produk" },
  { href: "/categories", label: "Kategori", icon: <Tag size={18} />, roles: ["admin"], description: "Atur kategori" },
  { href: "/inventory", label: "Inventori", icon: <Boxes size={18} />, roles: ["admin"], description: "Pergerakan stok" },
  { href: "/suppliers", label: "Supplier", icon: <Truck size={18} />, roles: ["admin"], description: "Daftar supplier" },
  { href: "/transactions", label: "Transaksi", icon: <FileText size={18} />, roles: ["admin", "cashier"], description: "Riwayat penjualan" },
  { href: "/reports", label: "Laporan", icon: <FilePieChart size={18} />, roles: ["admin"], description: "Analitik penjualan" },
  { href: "/users", label: "User", icon: <Users size={18} />, roles: ["admin"], description: "Manajemen staf" },
  { href: "/audit", label: "Audit Log", icon: <ClipboardList size={18} />, roles: ["admin"], description: "Catatan aktivitas" },
  { href: "/backup", label: "Backup", icon: <Database size={18} />, roles: ["admin"], description: "Cadangan database" },
  { href: "/settings", label: "Pengaturan", icon: <Settings size={18} />, roles: ["admin"], description: "Profil toko & struk" },
];

export default function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const filteredNav = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="sidebar">
      {/* Logo Header */}
      <div className="sidebar-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div className="logo-icon" style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0 }}>
            <ShoppingBag size={18} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <p style={{ fontWeight: 800, fontSize: "0.9375rem", letterSpacing: "-0.02em" }}>POS System</p>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Management
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {/* Section label */}
        <p style={{
          fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)",
          letterSpacing: "0.1em", textTransform: "uppercase",
          padding: "0.5rem 0.875rem 0.25rem", marginBottom: "0.25rem"
        }}>
          Menu
        </p>

        {filteredNav.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/cashier" && pathname.startsWith(item.href));

          return (
            <Link key={item.href} href={item.href} className={`nav-item ${isActive ? "active" : ""}`}>
              <span style={{
                width: 32, height: 32, borderRadius: 8, display: "flex",
                alignItems: "center", justifyContent: "center", flexShrink: 0,
                background: isActive ? "rgba(124,111,247,0.2)" : "var(--surface-2)",
                color: isActive ? "var(--primary-light)" : "var(--text-muted)",
                transition: "all 0.2s",
              }}>
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", fontWeight: 600, fontSize: "0.875rem" }}>{item.label}</span>
                {item.description && (
                  <span style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 400 }}>
                    {item.description}
                  </span>
                )}
              </span>
              {isActive && <ChevronRight size={14} style={{ color: "var(--primary)", opacity: 0.7 }} />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {/* User Card */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.625rem",
          padding: "0.75rem", background: "var(--surface-2)",
          border: "1px solid var(--surface-border)", borderRadius: 10,
          marginBottom: "0.5rem",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--primary), #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <User size={14} color="#fff" />
          </div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <p style={{
              fontSize: "0.8125rem", fontWeight: 700,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
            }}>
              {userName}
            </p>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
              {userRole === "admin" ? "👑 Administrator" : "🧾 Kasir"}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button onClick={handleLogout} className="nav-item" style={{ width: "100%" }}>
          <span style={{
            width: 32, height: 32, borderRadius: 8, display: "flex",
            alignItems: "center", justifyContent: "center",
            background: "rgba(239,68,68,0.1)", color: "var(--danger)",
          }}>
            <LogOut size={16} />
          </span>
          <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--danger)" }}>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
