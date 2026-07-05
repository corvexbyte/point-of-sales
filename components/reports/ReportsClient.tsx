// components/reports/ReportsClient.tsx
"use client";

import { useState, useMemo } from "react";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import {
  FilePieChart,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  Package,
  Users,
  AlertTriangle,
} from "lucide-react";

interface Transaction {
  id: string;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  created_at: string;
  cashier_id: string;
  profiles: { full_name: string } | null;
}

interface Product {
  id: string;
  name: string;
  stock: number;
  min_stock: number;
  price: number;
  categories: { name: string } | null;
}

interface TxItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  subtotal: number;
  transactions: { created_at: string; status: string } | null;
}

interface Props {
  transactions: any[];
  products: Product[];
  transactionItems: any[];
}

type Period = "today" | "week" | "month" | "year" | "all";
type ActiveTab = "sales" | "bestseller" | "lowstock" | "cashier";

export default function ReportsClient({
  transactions,
  products,
  transactionItems,
}: Props) {
  const [period, setPeriod] = useState<Period>("month");
  const [activeTab, setActiveTab] = useState<ActiveTab>("sales");

  // Filter transactions by selected period
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return (transactions as Transaction[]).filter((tx) => {
      const txDate = new Date(tx.created_at);
      if (period === "today") {
        return txDate.toDateString() === now.toDateString();
      }
      if (period === "week") {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return txDate >= oneWeekAgo;
      }
      if (period === "month") {
        return (
          txDate.getMonth() === now.getMonth() &&
          txDate.getFullYear() === now.getFullYear()
        );
      }
      if (period === "year") {
        return txDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [transactions, period]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = filteredTransactions.reduce((s, t) => s + t.total_amount, 0);
    const count = filteredTransactions.length;
    const avg = count > 0 ? Math.round(total / count) : 0;
    return { total, count, avg };
  }, [filteredTransactions]);

  // Sales breakdown by date
  const salesByDate = useMemo(() => {
    const groups: { [key: string]: { count: number; total: number } } = {};
    filteredTransactions.forEach((tx) => {
      const dateKey = new Date(tx.created_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      if (!groups[dateKey]) groups[dateKey] = { count: 0, total: 0 };
      groups[dateKey].count += 1;
      groups[dateKey].total += tx.total_amount;
    });
    return Object.entries(groups).map(([date, data]) => ({
      date,
      ...data,
    }));
  }, [filteredTransactions]);

  // Best Sellers ranking
  const bestSellers = useMemo(() => {
    const counts: { [key: string]: { name: string; qty: number; total: number } } = {};
    const filteredTxIds = new Set(filteredTransactions.map((t) => t.id));

    (transactionItems as TxItem[]).forEach((item) => {
      // Only include items from transactions in the active period
      const txId = (item as any).transaction_id;
      if (filteredTxIds.has(txId)) {
        if (!counts[item.product_id]) {
          counts[item.product_id] = { name: item.product_name, qty: 0, total: 0 };
        }
        counts[item.product_id].qty += item.quantity;
        counts[item.product_id].total += Number(item.subtotal);
      }
    });

    return Object.values(counts)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 15);
  }, [filteredTransactions, transactionItems]);

  // Low stock alert list (sisa stok <= min_stock)
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.stock <= (p.min_stock ?? 5));
  }, [products]);

  // Cashier performance list
  const cashierSales = useMemo(() => {
    const cashiers: { [key: string]: { name: string; count: number; total: number } } = {};
    filteredTransactions.forEach((tx) => {
      const name = tx.profiles?.full_name || "Kasir Lain";
      const key = tx.cashier_id;
      if (!cashiers[key]) {
        cashiers[key] = { name, count: 0, total: 0 };
      }
      cashiers[key].count += 1;
      cashiers[key].total += tx.total_amount;
    });
    return Object.values(cashiers).sort((a, b) => b.total - a.total);
  }, [filteredTransactions]);

  const exportCSV = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = "";

    if (activeTab === "sales") {
      headers = ["Tanggal", "Jumlah Transaksi", "Total Pendapatan"];
      rows = salesByDate.map((s) => [s.date, s.count, s.total]);
      filename = `Laporan_Penjualan_${period}`;
    } else if (activeTab === "bestseller") {
      headers = ["Nama Produk", "Kuantitas Terjual", "Total Penjualan"];
      rows = bestSellers.map((b) => [b.name, b.qty, b.total]);
      filename = `Produk_Terlaris_${period}`;
    } else if (activeTab === "lowstock") {
      headers = ["Nama Produk", "Kategori", "Stok Saat Ini", "Batas Min. Stok"];
      rows = lowStockProducts.map((p) => [
        p.name,
        p.categories?.name || "-",
        p.stock,
        p.min_stock ?? 5,
      ]);
      filename = "Produk_Hampir_Habis";
    } else if (activeTab === "cashier") {
      headers = ["Nama Kasir", "Jumlah Transaksi", "Total Omset"];
      rows = cashierSales.map((c) => [c.name, c.count, c.total]);
      filename = `Penjualan_per_Kasir_${period}`;
    }

    const csvContent =
      "\uFEFF" +
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: "1.5rem" }} className="reports-page">
      {/* CSS Cetak PDF Khusus Laporan */}
      <style>{`
        @media print {
          .sidebar, .page-header, .category-tabs, .no-print, .btn {
            display: none !important;
          }
          .main-content {
            background: #fff !important;
            color: #000 !important;
            padding: 0 !important;
          }
          .table-wrapper {
            box-shadow: none !important;
            border: 1px solid #000 !important;
            border-radius: 0 !important;
          }
          table th, table td {
            color: #000 !important;
            border-bottom: 1px solid #000 !important;
          }
          .print-only-title {
            display: block !important;
            text-align: center;
            margin-bottom: 1.5rem;
          }
        }
        .print-only-title {
          display: none;
        }
      `}</style>

      {/* Kop Cetak */}
      <div className="print-only-title">
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>LAPORAN ANALITIK POS</h1>
        <p style={{ fontSize: "0.875rem" }}>
          Periode: {period === "today" ? "Hari Ini" : period === "week" ? "Minggu Ini" : period === "month" ? "Bulan Ini" : "Semua Periode"}
        </p>
      </div>

      {/* Header */}
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">Analitik & Laporan</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Analisis data penjualan, produk terlaris, dan kinerja staf kasir
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {/* Period Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <Calendar size={16} color="var(--text-muted)" />
            <select
              className="form-input"
              style={{ width: 140, cursor: "pointer" }}
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
            >
              <option value="today">Hari Ini</option>
              <option value="week">Minggu Ini</option>
              <option value="month">Bulan Ini</option>
              <option value="year">Tahun Ini</option>
              <option value="all">Semua Waktu</option>
            </select>
          </div>

          <button className="btn btn-secondary" onClick={exportCSV} title="Download CSV (Excel)">
            <Download size={15} />
            Excel
          </button>
          <button className="btn btn-secondary" onClick={() => window.print()} title="Print PDF Laporan">
            <Printer size={15} />
            PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(79, 70, 229, 0.08)" }}>
            <TrendingUp size={20} color="var(--primary)" />
          </div>
          <p className="stat-label">Total Omset</p>
          <p className="stat-value" style={{ color: "var(--primary)" }}>{formatCurrency(metrics.total)}</p>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(5, 150, 105, 0.08)" }}>
            <TrendingUp size={20} color="var(--success)" />
          </div>
          <p className="stat-label">Jumlah Transaksi</p>
          <p className="stat-value">{metrics.count}</p>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(217, 119, 6, 0.08)" }}>
            <TrendingUp size={20} color="var(--accent)" />
          </div>
          <p className="stat-label">Rata-rata Keranjang</p>
          <p className="stat-value">{formatCurrency(metrics.avg)}</p>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="category-tabs no-print">
        <button
          className={`category-tab ${activeTab === "sales" ? "active" : ""}`}
          onClick={() => setActiveTab("sales")}
        >
          <TrendingUp size={14} style={{ marginRight: 4, display: "inline" }} />
          Penjualan Harian
        </button>
        <button
          className={`category-tab ${activeTab === "bestseller" ? "active" : ""}`}
          onClick={() => setActiveTab("bestseller")}
        >
          <Package size={14} style={{ marginRight: 4, display: "inline" }} />
          Produk Terlaris
        </button>
        <button
          className={`category-tab ${activeTab === "lowstock" ? "active" : ""}`}
          onClick={() => setActiveTab("lowstock")}
        >
          <AlertTriangle size={14} style={{ marginRight: 4, display: "inline" }} />
          Stok Menipis ({lowStockProducts.length})
        </button>
        <button
          className={`category-tab ${activeTab === "cashier" ? "active" : ""}`}
          onClick={() => setActiveTab("cashier")}
        >
          <Users size={14} style={{ marginRight: 4, display: "inline" }} />
          Penjualan Kasir
        </button>
      </div>

      {/* Tab Panels */}
      <div className="card">
        {activeTab === "sales" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Rincian Penjualan Harian</h2>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Tanggal Penjualan</th>
                    <th>Jumlah Transaksi</th>
                    <th>Total Omset</th>
                  </tr>
                </thead>
                <tbody>
                  {salesByDate.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                        Tidak ada transaksi pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    salesByDate.map((s) => (
                      <tr key={s.date}>
                        <td style={{ fontWeight: 600 }}>{s.date}</td>
                        <td>{s.count} transaksi</td>
                        <td style={{ fontWeight: 700, color: "var(--primary)" }}>{formatCurrency(s.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "bestseller" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Daftar Produk Paling Laris</h2>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Peringkat</th>
                    <th>Nama Produk</th>
                    <th>Kuantitas Terjual</th>
                    <th>Total Penjualan Rupiah</th>
                  </tr>
                </thead>
                <tbody>
                  {bestSellers.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                        Belum ada data penjualan produk.
                      </td>
                    </tr>
                  ) : (
                    bestSellers.map((b, idx) => (
                      <tr key={b.name}>
                        <td style={{ fontWeight: 700, color: "var(--text-muted)" }}>#{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>{b.name}</td>
                        <td style={{ fontWeight: 700 }}>{b.qty} unit</td>
                        <td style={{ fontWeight: 700, color: "var(--success)" }}>{formatCurrency(b.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "lowstock" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Produk yang Hampir Habis</h2>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Nama Produk</th>
                    <th>Kategori</th>
                    <th>Sisa Stok Fisik</th>
                    <th>Batas Minimum</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                        Semua stok produk aman di atas batas minimum.
                      </td>
                    </tr>
                  ) : (
                    lowStockProducts.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td>{p.categories?.name ?? "—"}</td>
                        <td style={{ fontWeight: 700, color: p.stock === 0 ? "var(--danger)" : "var(--accent)" }}>
                          {p.stock} unit
                        </td>
                        <td>{p.min_stock ?? 5} unit</td>
                        <td>
                          {p.stock === 0 ? (
                            <span className="badge badge-danger">Habis</span>
                          ) : (
                            <span className="badge badge-warning">Menipis</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "cashier" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Performa Omset per Kasir</h2>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Nama Kasir</th>
                    <th>Jumlah Transaksi</th>
                    <th>Total Omset Penjualan</th>
                  </tr>
                </thead>
                <tbody>
                  {cashierSales.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                        Belum ada transaksi pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    cashierSales.map((c) => (
                      <tr key={c.name}>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td>{c.count} transaksi</td>
                        <td style={{ fontWeight: 700, color: "var(--primary)" }}>{formatCurrency(c.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
