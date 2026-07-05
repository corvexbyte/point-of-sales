// components/dashboard/DashboardClient.tsx
"use client";

import { formatCurrency, formatDate } from "@/lib/utils/format";
import {
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  DollarSign,
  BarChart3,
} from "lucide-react";
import type { Transaction } from "@/types/pos.types";

interface Props {
  todayRevenue: number;
  totalRevenue: number;
  todayTransactions: number;
  totalProducts: number;
  lowStockCount: number;
  recentTransactions: (Transaction & { profiles: { full_name: string } | null })[];
}

export default function DashboardClient({
  todayRevenue,
  totalRevenue,
  todayTransactions,
  totalProducts,
  lowStockCount,
  recentTransactions,
}: Props) {
  const stats = [
    {
      label: "Pendapatan Hari Ini",
      value: formatCurrency(todayRevenue),
      icon: <TrendingUp size={20} color="var(--success)" />,
      bg: "rgba(16,185,129,0.12)",
    },
    {
      label: "Transaksi Hari Ini",
      value: todayTransactions.toString(),
      icon: <ShoppingCart size={20} color="var(--primary)" />,
      bg: "rgba(99,102,241,0.12)",
    },
    {
      label: "Total Pendapatan",
      value: formatCurrency(totalRevenue),
      icon: <DollarSign size={20} color="var(--accent)" />,
      bg: "rgba(245,158,11,0.12)",
    },
    {
      label: "Produk Aktif",
      value: totalProducts.toString(),
      icon: <Package size={20} color="var(--primary)" />,
      bg: "rgba(99,102,241,0.12)",
    },
  ];

  return (
    <div style={{ padding: "1.5rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
          <BarChart3 size={24} color="var(--primary)" />
          <h1 className="page-title" style={{ margin: 0 }}>Dashboard</h1>
        </div>
        <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
          Ringkasan performa toko Anda
        </p>
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div
              className="stat-icon"
              style={{ background: stat.bg }}
            >
              {stat.icon}
            </div>
            <p className="stat-label">{stat.label}</p>
            <p className="stat-value">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <div
          style={{
            background: "rgba(245,158,11,0.1)",
            border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: 12,
            padding: "1rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "1.75rem",
          }}
        >
          <AlertTriangle size={20} color="var(--accent)" />
          <div>
            <p style={{ fontWeight: 600, color: "var(--accent)" }}>
              Peringatan Stok Rendah
            </p>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              {lowStockCount} produk memiliki stok hampir habis (mencapai batas minimum). Segera lakukan restok.
            </p>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div>
        <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1rem" }}>
          Transaksi Terakhir
        </h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Kasir</th>
                <th>Metode</th>
                <th>Total</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      textAlign: "center",
                      padding: "2rem",
                      color: "var(--muted-foreground)",
                    }}
                  >
                    Belum ada transaksi hari ini
                  </td>
                </tr>
              ) : (
                recentTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ fontFamily: "monospace", fontWeight: 600 }}>
                      {tx.invoice_number}
                    </td>
                    <td>{tx.profiles?.full_name ?? "—"}</td>
                    <td>
                      <span
                        className="badge badge-muted"
                        style={{ textTransform: "uppercase" }}
                      >
                        {tx.payment_method}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {formatCurrency(tx.total_amount)}
                    </td>
                    <td
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--muted-foreground)",
                      }}
                    >
                      {formatDate(tx.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
