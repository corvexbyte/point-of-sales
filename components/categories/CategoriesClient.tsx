// components/categories/CategoriesClient.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils/format";
import { Plus, Pencil, Trash2, Tag, X, CheckCircle, XCircle } from "lucide-react";
import type { Category } from "@/types/pos.types";

interface Props {
  categories: Category[];
}

export default function CategoriesClient({ categories: initial }: Props) {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>(initial);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: "", description: "" });
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditItem(cat);
    setForm({ name: cat.name, description: cat.description ?? "" });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { showToast("error", "Nama kategori wajib diisi"); return; }
    setLoading(true);

    if (editItem) {
      const { data, error } = await supabase
        .from("categories")
        .update({ name: form.name, description: form.description || null })
        .eq("id", editItem.id)
        .select()
        .single();
      if (error) showToast("error", "Gagal mengupdate kategori");
      else {
        setCategories((prev) => prev.map((c) => (c.id === editItem.id ? (data as Category) : c)));
        showToast("success", "Kategori diupdate");
        setShowModal(false);
      }
    } else {
      const { data, error } = await supabase
        .from("categories")
        .insert({ name: form.name, description: form.description || null })
        .select()
        .single();
      if (error) showToast("error", error.message.includes("unique") ? "Nama kategori sudah ada" : "Gagal menambah kategori");
      else {
        setCategories((prev) => [data as Category, ...prev]);
        showToast("success", "Kategori ditambahkan");
        setShowModal(false);
      }
    }
    setLoading(false);
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Hapus kategori "${cat.name}"?\nProduk terkait tidak akan dihapus.`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", cat.id);
    if (error) showToast("error", "Gagal menghapus kategori");
    else {
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      showToast("success", "Kategori dihapus");
    }
  };

  return (
    <div style={{ padding: "1.5rem" }}>
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === "success" ? <CheckCircle size={18} color="var(--success)" /> : <XCircle size={18} color="var(--danger)" />}
            {toast.msg}
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Kategori Produk</h1>
          <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
            {categories.length} kategori terdaftar
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} />
          Tambah Kategori
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
        {categories.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: "1/-1" }}>
            <Tag size={40} />
            <p>Belum ada kategori</p>
          </div>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="card" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <div style={{ width: 36, height: 36, background: "rgba(99,102,241,0.15)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Tag size={16} color="var(--primary)" />
                  </div>
                  <p style={{ fontWeight: 700 }}>{cat.name}</p>
                </div>
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  <button className="btn btn-ghost btn-icon" onClick={() => openEdit(cat)}>
                    <Pencil size={14} />
                  </button>
                  <button className="btn btn-ghost btn-icon" style={{ color: "var(--danger)" }} onClick={() => handleDelete(cat)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {cat.description && (
                <p style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>{cat.description}</p>
              )}
              <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "auto" }}>
                Dibuat: {formatDate(cat.created_at)}
              </p>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editItem ? "Edit Kategori" : "Tambah Kategori"}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Nama Kategori *</label>
                <input type="text" className="form-input" placeholder="Makanan, Minuman, dll." value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Deskripsi</label>
                <textarea className="form-input" placeholder="Deskripsi kategori..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Batal</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={loading}>
                  {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} />Menyimpan...</> : editItem ? "Update" : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
