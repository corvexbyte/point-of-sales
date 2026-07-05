// components/products/ProductsClient.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Search,
  X,
  Upload,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { Product, Category } from "@/types/pos.types";
import { useRouter } from "next/navigation";

interface Props {
  products: Product[];
  categories: Category[];
}

const emptyForm = {
  name: "",
  description: "",
  price: "",
  cost_price: "",
  stock: "",
  sku: "",
  category_id: "",
  is_active: true,
  image_url: "",
};

export default function ProductsClient({ products: initialProducts, categories }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const openAdd = () => {
    setEditProduct(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview("");
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditProduct(product);
    setForm({
      name: product.name,
      description: product.description ?? "",
      price: String(product.price),
      cost_price: String(product.cost_price),
      stock: String(product.stock),
      sku: product.sku ?? "",
      category_id: product.category_id ?? "",
      is_active: product.is_active,
      image_url: product.image_url ?? "",
    });
    setImageFile(null);
    setImagePreview(product.image_url ?? "");
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(fileName, file, { upsert: true });
    if (error) return null;
    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      showToast("error", "Nama dan harga wajib diisi");
      return;
    }
    setLoading(true);

    let imageUrl = form.image_url;
    if (imageFile) {
      const uploaded = await uploadImage(imageFile);
      if (!uploaded) {
        showToast("error", "Gagal upload gambar");
        setLoading(false);
        return;
      }
      imageUrl = uploaded;
    }

    const payload = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      cost_price: parseFloat(form.cost_price) || 0,
      stock: parseInt(form.stock) || 0,
      sku: form.sku || null,
      category_id: form.category_id || null,
      is_active: form.is_active,
      image_url: imageUrl || null,
    };

    if (editProduct) {
      const { data, error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editProduct.id)
        .select("*, categories(name)")
        .single();

      if (error) {
        showToast("error", "Gagal mengupdate produk");
      } else {
        setProducts((prev) =>
          prev.map((p) => (p.id === editProduct.id ? (data as Product) : p))
        );
        showToast("success", "Produk berhasil diupdate");
        setShowModal(false);
      }
    } else {
      const { data, error } = await supabase
        .from("products")
        .insert(payload)
        .select("*, categories(name)")
        .single();

      if (error) {
        showToast("error", "Gagal menambah produk");
      } else {
        setProducts((prev) => [data as Product, ...prev]);
        showToast("success", "Produk berhasil ditambahkan");
        setShowModal(false);
      }
    }
    setLoading(false);
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Hapus produk "${product.name}"?`)) return;
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);
    if (error) {
      showToast("error", "Gagal menghapus produk");
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      showToast("success", "Produk dihapus");
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ padding: "1.5rem" }}>
      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === "success" ? (
              <CheckCircle size={18} color="var(--success)" />
            ) : (
              <XCircle size={18} color="var(--danger)" />
            )}
            {toast.msg}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Manajemen Produk</h1>
          <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
            {products.length} produk terdaftar
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} />
          Tambah Produk
        </button>
      </div>

      {/* Search */}
      <div className="search-wrapper" style={{ marginBottom: "1rem", maxWidth: 400 }}>
        <Search size={16} />
        <input
          type="text"
          className="form-input search-input"
          placeholder="Cari produk atau SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Produk</th>
              <th>Kategori</th>
              <th>Harga Jual</th>
              <th>Stok</th>
              <th>Status</th>
              <th>Tanggal</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "var(--muted-foreground)" }}>
                  Tidak ada produk
                </td>
              </tr>
            ) : (
              filtered.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      {product.image_url ? (
                        <div style={{ position: "relative", width: 40, height: 40, flexShrink: 0 }}>
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            style={{ objectFit: "cover", borderRadius: 6 }}
                            sizes="40px"
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            background: "var(--secondary)",
                            borderRadius: 6,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Package size={18} color="var(--muted-foreground)" />
                        </div>
                      )}
                      <div>
                        <p style={{ fontWeight: 600 }}>{product.name}</p>
                        {product.sku && (
                          <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                            SKU: {product.sku}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    {product.categories?.name ? (
                      <span className="badge badge-primary">{product.categories.name}</span>
                    ) : (
                      <span className="text-muted" style={{ fontSize: "0.8125rem" }}>—</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(product.price)}</td>
                  <td>
                    <span
                      style={{
                        color: product.stock === 0
                          ? "var(--danger)"
                          : product.stock <= 5
                          ? "var(--accent)"
                          : "var(--success)",
                        fontWeight: 700,
                      }}
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${product.is_active ? "badge-success" : "badge-muted"}`}>
                      {product.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td style={{ color: "var(--muted-foreground)", fontSize: "0.8125rem" }}>
                    {formatDate(product.created_at)}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.375rem" }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEdit(product)}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(product)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal modal-lg" style={{ maxHeight: "90vh", overflowY: "auto" }}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editProduct ? "Edit Produk" : "Tambah Produk"}
              </h2>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Image Upload */}
              <div className="form-group">
                <label className="form-label">Foto Produk</label>
                <div
                  style={{
                    border: "2px dashed var(--card-border)",
                    borderRadius: 10,
                    padding: "1rem",
                    textAlign: "center",
                    cursor: "pointer",
                    position: "relative",
                  }}
                >
                  {imagePreview ? (
                    <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto" }}>
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        style={{ objectFit: "cover", borderRadius: 8 }}
                        sizes="120px"
                      />
                    </div>
                  ) : (
                    <div style={{ color: "var(--muted-foreground)" }}>
                      <Upload size={24} style={{ margin: "0 auto 0.5rem" }} />
                      <p style={{ fontSize: "0.875rem" }}>Klik untuk upload gambar</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: 0,
                      cursor: "pointer",
                    }}
                  />
                </div>
              </div>

              {/* Name & SKU */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div className="form-group">
                  <label className="form-label">Nama Produk *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nama produk"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="SKU-001"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  />
                </div>
              </div>

              {/* Price & Cost */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div className="form-group">
                  <label className="form-label">Harga Jual *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Harga Modal</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    value={form.cost_price}
                    onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                  />
                </div>
              </div>

              {/* Stock & Category */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div className="form-group">
                  <label className="form-label">Stok</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <select
                    className="form-input"
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  >
                    <option value="">Tanpa Kategori</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Deskripsi</label>
                <textarea
                  className="form-input"
                  placeholder="Deskripsi produk..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {/* Active toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  style={{ width: 16, height: 16, cursor: "pointer" }}
                />
                <label htmlFor="is_active" style={{ fontSize: "0.875rem", cursor: "pointer" }}>
                  Produk Aktif (tampil di kasir)
                </label>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.5rem" }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner" style={{ width: 16, height: 16 }} />
                      Menyimpan...
                    </>
                  ) : editProduct ? (
                    "Update Produk"
                  ) : (
                    "Simpan Produk"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
