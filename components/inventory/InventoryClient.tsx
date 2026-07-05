// components/inventory/InventoryClient.tsx
"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Boxes, ArrowDownLeft, ArrowUpRight, Scale, History, Plus, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface ShortProduct {
  id: string;
  name: string;
  stock: number;
  sku: string | null;
}

interface ShortSupplier {
  id: string;
  name: string;
}

interface Movement {
  id: string;
  product_id: string;
  type: "in" | "out" | "adjust";
  quantity: number;
  stock_before: number;
  stock_after: number;
  supplier_id: string | null;
  reason: string | null;
  user_id: string | null;
  created_at: string;
  products: { name: string; sku: string | null } | null;
  suppliers: { name: string } | null;
  profiles: { full_name: string } | null;
}

interface Props {
  products: ShortProduct[];
  suppliers: ShortSupplier[];
  initialMovements: any[];
  currentUserId: string;
}

type Tab = "in" | "out" | "adjust" | "history";

export default function InventoryClient({
  products,
  suppliers,
  initialMovements,
  currentUserId,
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<Tab>("in");
  const [movements, setMovements] = useState<Movement[]>(initialMovements);
  const [loading, setLoading] = useState(false);

  // Form States - Barang Masuk
  const [inProduct, setInProduct] = useState("");
  const [inSupplier, setInSupplier] = useState("");
  const [inQty, setInQty] = useState("");
  const [inNotes, setInNotes] = useState("");

  // Form States - Barang Keluar
  const [outProduct, setOutProduct] = useState("");
  const [outQty, setOutQty] = useState("");
  const [outReason, setOutReason] = useState("");

  // Form States - Penyesuaian Stok
  const [adjProduct, setAdjProduct] = useState("");
  const [adjQty, setAdjQty] = useState("");
  const [adjNotes, setAdjNotes] = useState("");

  const handleInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inProduct || !inQty) return;
    setLoading(true);

    const qty = parseInt(inQty);
    const { data, error } = await supabase
      .from("inventory_movements")
      .insert({
        product_id: inProduct,
        type: "in",
        quantity: qty,
        supplier_id: inSupplier || null,
        reason: inNotes || null,
        user_id: currentUserId,
      })
      .select("*, products(name, sku), suppliers(name), profiles(full_name)")
      .single();

    if (error) {
      alert("Gagal menyimpan barang masuk: " + error.message);
    } else {
      setMovements((prev) => [data as Movement, ...prev]);
      setInProduct("");
      setInSupplier("");
      setInQty("");
      setInNotes("");
      alert("Barang masuk berhasil disimpan! Stok terupdate otomatis.");
      router.refresh();
    }
    setLoading(false);
  };

  const handleOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outProduct || !outQty) return;

    const qty = parseInt(outQty);
    const selectedProd = products.find((p) => p.id === outProduct);
    if (selectedProd && selectedProd.stock < qty) {
      alert("Jumlah barang keluar melebihi stok yang tersedia!");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("inventory_movements")
      .insert({
        product_id: outProduct,
        type: "out",
        quantity: qty,
        reason: outReason || null,
        user_id: currentUserId,
      })
      .select("*, products(name, sku), suppliers(name), profiles(full_name)")
      .single();

    if (error) {
      alert("Gagal menyimpan barang keluar: " + error.message);
    } else {
      setMovements((prev) => [data as Movement, ...prev]);
      setOutProduct("");
      setOutQty("");
      setOutReason("");
      alert("Barang keluar berhasil disimpan! Stok terupdate otomatis.");
      router.refresh();
    }
    setLoading(false);
  };

  const handleAdjSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjProduct || !adjQty) return;
    setLoading(true);

    const qty = parseInt(adjQty);
    const { data, error } = await supabase
      .from("inventory_movements")
      .insert({
        product_id: adjProduct,
        type: "adjust",
        quantity: qty,
        reason: adjNotes || null,
        user_id: currentUserId,
      })
      .select("*, products(name, sku), suppliers(name), profiles(full_name)")
      .single();

    if (error) {
      alert("Gagal menyimpan penyesuaian: " + error.message);
    } else {
      setMovements((prev) => [data as Movement, ...prev]);
      setAdjProduct("");
      setAdjQty("");
      setAdjNotes("");
      alert("Penyesuaian stok berhasil disimpan! Stok baru telah diset.");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "1.5rem" }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Manajemen Inventori & Stok</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Catat barang masuk, barang keluar, penyesuaian stok, dan audit riwayat stok
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="category-tabs" style={{ marginBottom: "1.5rem" }}>
        <button
          className={`category-tab ${activeTab === "in" ? "active" : ""}`}
          onClick={() => setActiveTab("in")}
        >
          <ArrowDownLeft size={14} style={{ marginRight: 4, display: "inline" }} />
          Barang Masuk
        </button>
        <button
          className={`category-tab ${activeTab === "out" ? "active" : ""}`}
          onClick={() => setActiveTab("out")}
        >
          <ArrowUpRight size={14} style={{ marginRight: 4, display: "inline" }} />
          Barang Keluar
        </button>
        <button
          className={`category-tab ${activeTab === "adjust" ? "active" : ""}`}
          onClick={() => setActiveTab("adjust")}
        >
          <Scale size={14} style={{ marginRight: 4, display: "inline" }} />
          Penyesuaian Stok
        </button>
        <button
          className={`category-tab ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          <History size={14} style={{ marginRight: 4, display: "inline" }} />
          Riwayat Pergerakan
        </button>
      </div>

      {/* Tab Panels */}
      <div className="card">
        {activeTab === "in" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Catat Barang Masuk</h2>
            <form onSubmit={handleInSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 500 }}>
              <div className="form-group">
                <label className="form-label">Pilih Produk *</label>
                <select className="form-input" value={inProduct} onChange={(e) => setInProduct(e.target.value)} required>
                  <option value="">-- Pilih Produk --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stok saat ini: {p.stock}) {p.sku ? `[${p.sku}]` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Pilih Supplier</label>
                <select className="form-input" value={inSupplier} onChange={(e) => setInSupplier(e.target.value)}>
                  <option value="">-- Pilih Supplier (Opsional) --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Jumlah Barang Masuk *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Kuantitas..."
                  value={inQty}
                  onChange={(e) => setInQty(e.target.value)}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Keterangan / Catatan</label>
                <textarea
                  className="form-input"
                  placeholder="Keterangan tambahan barang masuk..."
                  value={inNotes}
                  onChange={(e) => setInNotes(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start" }} disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan Barang Masuk"}
              </button>
            </form>
          </div>
        )}

        {activeTab === "out" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Catat Barang Keluar</h2>
            <form onSubmit={handleOutSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 500 }}>
              <div className="form-group">
                <label className="form-label">Pilih Produk *</label>
                <select className="form-input" value={outProduct} onChange={(e) => setOutProduct(e.target.value)} required>
                  <option value="">-- Pilih Produk --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stok saat ini: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Jumlah Barang Keluar *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Kuantitas..."
                  value={outQty}
                  onChange={(e) => setOutQty(e.target.value)}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Alasan Barang Keluar / Rusak *</label>
                <textarea
                  className="form-input"
                  placeholder="Sebutkan alasan (misal: Barang kedaluwarsa, rusak, retur ke pabrik)..."
                  value={outReason}
                  onChange={(e) => setOutReason(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start" }} disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan Barang Keluar"}
              </button>
            </form>
          </div>
        )}

        {activeTab === "adjust" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--surface-2)", border: "1px solid var(--surface-border)", padding: "0.75rem 1rem", borderRadius: 10, marginBottom: "1rem" }}>
              <AlertCircle size={18} color="var(--accent)" />
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", margin: 0 }}>
                <strong>Penting:</strong> Penyesuaian stok akan **menimpa secara langsung** jumlah stok produk di sistem agar sesuai dengan stok fisik yang dihitung di toko.
              </p>
            </div>
            
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Penyesuaian Stok Fisik</h2>
            <form onSubmit={handleAdjSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 500 }}>
              <div className="form-group">
                <label className="form-label">Pilih Produk *</label>
                <select className="form-input" value={adjProduct} onChange={(e) => setAdjProduct(e.target.value)} required>
                  <option value="">-- Pilih Produk --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stok sistem saat ini: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Jumlah Sebenarnya (Stok Fisik) *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Jumlah riil di toko saat ini..."
                  value={adjQty}
                  onChange={(e) => setAdjQty(e.target.value)}
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Alasan Penyesuaian *</label>
                <textarea
                  className="form-input"
                  placeholder="Sebutkan alasan (misal: Hasil stock opname Juli 2026)..."
                  value={adjNotes}
                  onChange={(e) => setAdjNotes(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start" }} disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan Penyesuaian"}
              </button>
            </form>
          </div>
        )}

        {activeTab === "history" && (
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Riwayat Mutasi Stok</h2>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>Nama Produk</th>
                    <th>Jenis</th>
                    <th>Jumlah</th>
                    <th>Stok Sebelum</th>
                    <th>Stok Sesudah</th>
                    <th>Supplier / Keterangan</th>
                    <th>Staf</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                        Belum ada riwayat pergerakan stok.
                      </td>
                    </tr>
                  ) : (
                    movements.map((m) => (
                      <tr key={m.id}>
                        <td style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                          {formatDate(m.created_at)}
                        </td>
                        <td style={{ fontWeight: 600 }}>{m.products?.name ?? "—"}</td>
                        <td>
                          {m.type === "in" && (
                            <span className="badge badge-success">Masuk</span>
                          )}
                          {m.type === "out" && (
                            <span className="badge badge-danger">Keluar</span>
                          )}
                          {m.type === "adjust" && (
                            <span className="badge badge-warning">Penyesuaian</span>
                          )}
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          {m.type === "in" ? "+" : m.type === "out" ? "-" : ""}
                          {m.quantity}
                        </td>
                        <td>{m.stock_before}</td>
                        <td style={{ fontWeight: 600 }}>{m.stock_after}</td>
                        <td style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                          {m.type === "in" && m.suppliers?.name ? `Supplier: ${m.suppliers.name}` : ""}
                          {m.reason ? `Ket: ${m.reason}` : ""}
                        </td>
                        <td>{m.profiles?.full_name ?? "—"}</td>
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
