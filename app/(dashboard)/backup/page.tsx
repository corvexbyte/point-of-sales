// app/(dashboard)/backup/page.tsx
import { Database, Download, ShieldCheck, RefreshCw } from "lucide-react";

export const metadata = { title: "Cadangan Database - POS System" };

export default function BackupPage() {
  return (
    <div style={{ padding: "1.5rem" }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className="page-title">Backup & Pemulihan Database</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Metode cadangan dan pemulihan data sistem POS menggunakan arsitektur cloud Supabase
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        
        {/* Supabase Automatic Backup */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: 42, height: 42, background: "rgba(16,185,129,0.1)", borderRadius: 10, display: "flex", alignItems: "center", justifyC: "center", justifyContent: "center" }}>
              <ShieldCheck size={20} color="var(--success)" />
            </div>
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>Cadangan Cloud Otomatis</h2>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Supabase Managed Backups</p>
            </div>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Supabase secara otomatis mencadangkan seluruh data transaksi, produk, dan akun user Anda setiap hari secara terjadwal di server cloud.
          </p>
          <div style={{ background: "var(--surface-2)", border: "1px solid var(--surface-border)", borderRadius: 8, padding: "0.75rem", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
            <strong>Catatan:</strong> Jika terjadi kerusakan fatal, Anda dapat memulihkan database secara point-in-time melalui Dashboard Supabase pada menu <strong>Database → Backups</strong>.
          </div>
        </div>

        {/* Manual Export via CLI */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: 42, height: 42, background: "rgba(79, 70, 229, 0.1)", borderRadius: 10, display: "flex", alignItems: "center", justifyC: "center", justifyContent: "center" }}>
              <Download size={20} color="var(--primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>Ekspor Data Manual (CLI)</h2>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Panduan Supabase CLI</p>
            </div>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Anda dapat mendownload seluruh skema tabel, data transaksi, dan konfigurasi RLS secara mandiri ke komputer lokal menggunakan perintah CLI.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Perintah Ekspor Data:</p>
            <pre style={{ background: "var(--surface-3)", padding: "0.625rem", borderRadius: 6, fontFamily: "monospace", fontSize: "0.75rem", color: "var(--text-secondary)", overflowX: "auto" }}>
              supabase db dump --data-only -f backup_data.sql
            </pre>
          </div>
        </div>

        {/* Manual Restore */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: 42, height: 42, background: "rgba(245, 158, 11, 0.1)", borderRadius: 10, display: "flex", alignItems: "center", justifyC: "center", justifyContent: "center" }}>
              <RefreshCw size={20} color="var(--accent)" />
            </div>
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>Restorasi Database</h2>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>SQL Query / CLI Restore</p>
            </div>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Untuk memulihkan data dari file sql cadangan lokal, Anda dapat langsung mengunggah file tersebut melalui dashboard editor SQL Supabase.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Perintah Restorasi:</p>
            <pre style={{ background: "var(--surface-3)", padding: "0.625rem", borderRadius: 6, fontFamily: "monospace", fontSize: "0.75rem", color: "var(--text-secondary)", overflowX: "auto" }}>
              psql -h db.drkhcthrcryekdbrtbfa.supabase.co -U postgres -f backup_data.sql
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
}
