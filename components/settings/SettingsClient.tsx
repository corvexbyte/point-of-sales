// components/settings/SettingsClient.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Settings, Save, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface ShopSettings {
  id?: string;
  shop_name: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  tax_rate: number;
  currency: string;
  receipt_footer: string | null;
}

interface Props {
  initialSettings: ShopSettings | null;
}

export default function SettingsClient({ initialSettings }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form states
  const [shopName, setShopName] = useState(initialSettings?.shop_name ?? "Toko POS");
  const [address, setAddress] = useState(initialSettings?.address ?? "");
  const [phone, setPhone] = useState(initialSettings?.phone ?? "");
  const [email, setEmail] = useState(initialSettings?.email ?? "");
  const [taxRate, setTaxRate] = useState(initialSettings?.tax_rate ?? 11);
  const [currency, setCurrency] = useState(initialSettings?.currency ?? "Rp");
  const [receiptFooter, setReceiptFooter] = useState(initialSettings?.receipt_footer ?? "");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    const payload = {
      shop_name: shopName,
      address: address || null,
      phone: phone || null,
      email: email || null,
      tax_rate: Number(taxRate),
      currency: currency || "Rp",
      receipt_footer: receiptFooter || null,
    };

    let error;

    if (initialSettings?.id) {
      const { error: err } = await supabase
        .from("settings")
        .update(payload)
        .eq("id", initialSettings.id);
      error = err;
    } else {
      const { error: err } = await supabase
        .from("settings")
        .insert(payload);
      error = err;
    }

    if (error) {
      alert("Gagal menyimpan pengaturan: " + error.message);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "1.5rem" }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Pengaturan Toko</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Kelola profil toko, set PPN default, mata uang, dan template struk cetak
          </p>
        </div>
      </div>

      {success && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          background: "#f0fdf4", border: "1px solid rgba(5,150,105,0.2)",
          padding: "0.75rem 1rem", borderRadius: 10, color: "var(--success)",
          marginBottom: "1rem", fontSize: "0.875rem", fontWeight: 600
        }}>
          <CheckCircle size={16} />
          Pengaturan berhasil disimpan!
        </div>
      )}

      <div className="card" style={{ maxWidth: 600 }}>
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          
          <div className="form-group">
            <label className="form-label">Nama Toko *</label>
            <input
              type="text"
              className="form-input"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Nomor Telepon Toko</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: 021-1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Toko</label>
              <input
                type="email"
                className="form-input"
                placeholder="info@tokosaya.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Alamat Toko</label>
            <textarea
              className="form-input"
              placeholder="Alamat lengkap toko..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">PPN (%) *</label>
              <input
                type="number"
                className="form-input"
                min="0"
                max="100"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Simbol Mata Uang *</label>
              <input
                type="text"
                className="form-input"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Catatan Kaki Struk (Receipt Footer)</label>
            <textarea
              className="form-input"
              placeholder="Contoh: Barang yang sudah dibeli tidak dapat ditukar..."
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start", marginTop: "0.5rem" }} disabled={loading}>
            <Save size={16} />
            {loading ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
        </form>
      </div>
    </div>
  );
}
