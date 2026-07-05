// components/transactions/TransactionsClient.tsx
"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import {
  FileText,
  Eye,
  X,
  Printer,
  Trash2,
  Download,
  Calendar,
} from "lucide-react";
import type { Transaction, TransactionItem, UserRole } from "@/types/pos.types";
import Receipt from "./Receipt";
import { useRouter } from "next/navigation";

interface Props {
  transactions: Transaction[];
  userRole: UserRole;
}

export default function TransactionsClient({ transactions, userRole }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [transactionsList, setTransactionsList] = useState<Transaction[]>(transactions);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Mendapatkan daftar bulan unik dari transaksi yang ada untuk rekap bulanan
  const uniqueMonths = useMemo(() => {
    const monthsMap = new Map<string, string>();
    transactions.forEach((tx) => {
      const date = new Date(tx.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = new Intl.DateTimeFormat("id-ID", {
        month: "long",
        year: "numeric",
      }).format(date);
      monthsMap.set(key, label);
    });
    return Array.from(monthsMap.entries()).map(([key, label]) => ({
      key,
      label,
    }));
  }, [transactions]);

  // Memfilter transaksi berdasarkan bulan atau tanggal spesifik yang dipilih
  const filteredTransactions = useMemo(() => {
    let list = transactionsList;

    if (selectedMonth !== "all") {
      list = list.filter((tx) => {
        const date = new Date(tx.created_at);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        return key === selectedMonth;
      });
    }

    if (selectedDate) {
      list = list.filter((tx) => {
        const date = new Date(tx.created_at);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        return key === selectedDate;
      });
    }

    return list;
  }, [transactionsList, selectedMonth, selectedDate]);

  const openDetail = async (tx: Transaction) => {
    setSelected(tx);
    setShowReceipt(false);
    setLoadingItems(true);
    const { data } = await supabase
      .from("transaction_items")
      .select("*")
      .eq("transaction_id", tx.id);
    setItems((data as TransactionItem[]) ?? []);
    setLoadingItems(false);
  };

  const handleDelete = async (txId: string, invoiceNumber: string) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus transaksi ${invoiceNumber}?\nStok produk akan otomatis dikembalikan ke inventori.`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", txId);

    if (error) {
      alert("Gagal menghapus transaksi: " + error.message);
    } else {
      setTransactionsList((prev) => prev.filter((tx) => tx.id !== txId));
      if (selected?.id === txId) {
        setSelected(null);
      }
      alert(`Transaksi ${invoiceNumber} berhasil dihapus dan stok telah dikembalikan!`);
      router.refresh();
    }
  };

  const exportToExcel = () => {
    const headers = [
      "No Invoice",
      "Tanggal",
      "Metode Pembayaran",
      "Subtotal",
      "Pajak",
      "Diskon",
      "Total",
      "Bayar",
      "Kembalian",
      "Kasir",
      "Status",
    ];

    const rows = filteredTransactions.map((tx) => [
      tx.invoice_number,
      formatDate(tx.created_at),
      tx.payment_method.toUpperCase(),
      tx.subtotal,
      tx.tax_amount,
      tx.discount_amount,
      tx.total_amount,
      tx.paid_amount,
      tx.change_amount,
      tx.profiles?.full_name || "-",
      tx.status === "completed" ? "Selesai" : "Dibatalkan",
    ]);

    // Menggunakan pemisah semicolon agar langsung rapi di Excel Regional Indonesia/Eropa
    const csvContent =
      "\uFEFF" +
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Laporan_Transaksi_${
        selectedMonth === "all" ? "Semua_Bulan" : selectedMonth
      }.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printTable = () => {
    window.print();
  };

  const statusColor = (status: string) => {
    if (status === "completed") return "badge-success";
    if (status === "voided") return "badge-danger";
    return "badge-warning";
  };

  const statusLabel = (status: string) => {
    if (status === "completed") return "Selesai";
    if (status === "voided") return "Dibatalkan";
    return "Pending";
  };

  return (
    <div style={{ padding: "1.5rem" }} className="transactions-page">
      {/* CSS Khusus untuk Mode Cetak Laporan agar Rapi */}
      <style>{`
        @media print {
          .sidebar, .page-header, .btn, select, .no-print, .actions-column {
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
          .print-header {
            display: block !important;
            text-align: center;
            margin-bottom: 2rem;
            color: #000;
          }
        }
        .print-header {
          display: none;
        }
      `}</style>

      {/* Header Cetak PDF */}
      <div className="print-header">
        <h1 style={{ fontSize: "1.75rem", fontWeight: "bold" }}>LAPORAN RIWAYAT TRANSAKSI</h1>
        <p style={{ fontSize: "0.875rem" }}>
          Periode Bulan: {selectedMonth === "all" ? "Semua Bulan" : selectedMonth}
        </p>
        <p style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
          Dicetak pada: {new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(new Date())}
        </p>
      </div>

      {/* Page Header (Halaman Biasa) */}
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">Riwayat Transaksi</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Menampilkan {filteredTransactions.length} transaksi
          </p>
        </div>

        {/* Filters and Actions */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          
          {/* Date Picker (Pilih Tanggal) */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <input
              type="date"
              className="form-input"
              style={{ width: 150, padding: "0.45rem 0.625rem", cursor: "pointer" }}
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedMonth("all"); // Reset filter bulan saat tanggal dipilih
              }}
            />
            {selectedDate && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ padding: "0.25rem 0.5rem", color: "var(--danger)", fontWeight: 600 }}
                onClick={() => setSelectedDate("")}
              >
                Reset
              </button>
            )}
          </div>

          {/* Dropdown Rekap Bulanan */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <select
              className="form-input"
              style={{ width: 160, cursor: "pointer" }}
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setSelectedDate(""); // Reset filter tanggal saat bulan dipilih
              }}
            >
              <option value="all">Semua Bulan</option>
              {uniqueMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Export Buttons */}
          <button
            className="btn btn-secondary"
            onClick={exportToExcel}
            disabled={filteredTransactions.length === 0}
            title="Download laporan format CSV (Excel)"
          >
            <Download size={15} />
            Excel
          </button>

          <button
            className="btn btn-secondary"
            onClick={printTable}
            disabled={filteredTransactions.length === 0}
            title="Cetak Laporan / Simpan PDF"
          >
            <Printer size={15} />
            PDF
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Tanggal</th>
              {userRole === "admin" && <th>Kasir</th>}
              <th>Metode</th>
              <th>Total</th>
              <th>Status</th>
              <th className="actions-column">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td
                  colSpan={userRole === "admin" ? 7 : 6}
                  style={{
                    textAlign: "center",
                    padding: "3rem 1rem",
                    color: "var(--text-muted)",
                  }}
                >
                  <div className="empty-state">
                    <FileText size={40} />
                    <p style={{ fontWeight: 600 }}>Tidak ada transaksi ditemukan</p>
                    <p style={{ fontSize: "0.8125rem" }}>
                      Silakan pilih rekap bulan lain atau lakukan transaksi baru
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => (
                <tr key={tx.id}>
                  <td style={{ fontFamily: "monospace", fontWeight: 700 }}>
                    {tx.invoice_number}
                  </td>
                  <td style={{ fontSize: "0.8125rem" }}>
                    {formatDate(tx.created_at)}
                  </td>
                  {userRole === "admin" && (
                    <td>{tx.profiles?.full_name ?? "—"}</td>
                  )}
                  <td>
                    <span
                      className="badge badge-muted"
                      style={{ textTransform: "uppercase" }}
                    >
                      {tx.payment_method}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: "var(--primary)" }}>
                    {formatCurrency(tx.total_amount)}
                  </td>
                  <td>
                    <span className={`badge ${statusColor(tx.status)}`}>
                      {statusLabel(tx.status)}
                    </span>
                  </td>
                  <td className="actions-column">
                    <div style={{ display: "flex", gap: "0.375rem" }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openDetail(tx)}
                      >
                        <Eye size={13} />
                        Detail
                      </button>
                      <button
                        className="btn btn-danger btn-sm btn-icon"
                        style={{ width: 28, height: 28 }}
                        onClick={() => handleDelete(tx.id, tx.invoice_number)}
                        title="Hapus transaksi & kembalikan stok"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="modal-overlay no-print">
          <div className="modal modal-lg">
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{selected.invoice_number}</h2>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                  {formatDate(selected.created_at)}
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowReceipt(!showReceipt)}
                >
                  <Printer size={14} />
                  {showReceipt ? "Sembunyikan Struk" : "Lihat Struk"}
                </button>
                {showReceipt && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => window.print()}
                  >
                    🖨️ Cetak
                  </button>
                )}
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(selected.id, selected.invoice_number)}
                >
                  <Trash2 size={14} />
                  Hapus
                </button>
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={() => setSelected(null)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {showReceipt ? (
              <Receipt
                invoiceNumber={selected.invoice_number}
                items={items.map((i) => ({
                  product: {
                    id: i.product_id,
                    name: i.product_name,
                    price: i.product_price,
                    stock: 0,
                    image_url: null,
                    category_id: null,
                    description: null,
                    cost_price: 0,
                    sku: null,
                    is_active: true,
                    created_at: "",
                    updated_at: "",
                  },
                  quantity: i.quantity,
                }))}
                subtotal={selected.subtotal}
                taxAmount={selected.tax_amount}
                discountAmount={selected.discount_amount}
                totalAmount={selected.total_amount}
                paidAmount={selected.paid_amount}
                changeAmount={selected.change_amount}
                paymentMethod={selected.payment_method}
                createdAt={selected.created_at}
                cashierName={selected.profiles?.full_name}
              />
            ) : (
              <div>
                {loadingItems ? (
                  <div style={{ textAlign: "center", padding: "2rem" }}>
                    <span className="spinner" style={{ margin: "0 auto" }} />
                  </div>
                ) : (
                  <>
                    {/* Items */}
                    <div style={{ marginBottom: "1rem" }}>
                      <p
                        style={{
                          fontWeight: 700,
                          marginBottom: "0.5rem",
                          fontSize: "0.875rem",
                        }}
                      >
                        Item Pembelian
                      </p>
                      <div className="table-wrapper">
                        <table>
                          <thead>
                            <tr>
                              <th>Produk</th>
                              <th>Harga</th>
                              <th>Qty</th>
                              <th>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item) => (
                              <tr key={item.id}>
                                <td style={{ fontWeight: 600 }}>{item.product_name}</td>
                                <td>{formatCurrency(item.product_price)}</td>
                                <td>{item.quantity}</td>
                                <td style={{ fontWeight: 700, color: "var(--primary)" }}>
                                  {formatCurrency(item.subtotal)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Summary */}
                    <div
                      style={{
                        background: "var(--surface-2)",
                        border: "1px solid var(--surface-border)",
                        borderRadius: 12,
                        padding: "1.25rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      {[
                        { label: "Subtotal", value: selected.subtotal },
                        selected.discount_amount > 0 && {
                          label: "Diskon",
                          value: -selected.discount_amount,
                        },
                        { label: "PPN 11%", value: selected.tax_amount },
                        {
                          label: "Total",
                          value: selected.total_amount,
                          bold: true,
                        },
                        {
                          label: `Bayar (${selected.payment_method.toUpperCase()})`,
                          value: selected.paid_amount,
                        },
                        selected.payment_method === "cash" && {
                          label: "Kembalian",
                          value: selected.change_amount,
                        },
                      ]
                        .filter(Boolean)
                        .map((row: any) => (
                          <div
                            key={row.label}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: row.bold ? "1rem" : "0.875rem",
                              fontWeight: row.bold ? 800 : 500,
                              color: row.bold
                                ? "var(--text-primary)"
                                : "var(--text-secondary)",
                              borderTop: row.bold
                                ? "1px solid var(--surface-border)"
                                : "none",
                              paddingTop: row.bold ? "0.625rem" : 0,
                              marginTop: row.bold ? "0.25rem" : 0,
                            }}
                          >
                            <span>{row.label}</span>
                            <span
                              style={{
                                color:
                                  row.value < 0
                                    ? "var(--success)"
                                    : row.bold
                                    ? "var(--primary)"
                                    : "inherit",
                              }}
                            >
                              {formatCurrency(Math.abs(row.value))}
                            </span>
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
