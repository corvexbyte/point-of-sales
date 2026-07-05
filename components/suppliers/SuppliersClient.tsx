// components/suppliers/SuppliersClient.tsx
"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, Search, X, Truck } from "lucide-react";
import { useRouter } from "next/navigation";

interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}

interface Props {
  initialSuppliers: Supplier[];
}

export default function SuppliersClient({ initialSuppliers }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.address && s.address.toLowerCase().includes(search.toLowerCase())) ||
        (s.email && s.email.toLowerCase().includes(search.toLowerCase()));
      return matchSearch;
    });
  }, [suppliers, search]);

  const openAdd = () => {
    setEditingSupplier(null);
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setNotes("");
    setShowModal(true);
  };

  const openEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setName(supplier.name);
    setPhone(supplier.phone ?? "");
    setEmail(supplier.email ?? "");
    setAddress(supplier.address ?? "");
    setNotes(supplier.notes ?? "");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    const payload = {
      name,
      phone: phone || null,
      email: email || null,
      address: address || null,
      notes: notes || null,
    };

    if (editingSupplier) {
      const { data, error } = await supabase
        .from("suppliers")
        .update(payload)
        .eq("id", editingSupplier.id)
        .select()
        .single();

      if (error) {
        alert("Gagal mengupdate supplier: " + error.message);
      } else {
        setSuppliers((prev) =>
          prev.map((s) => (s.id === editingSupplier.id ? (data as Supplier) : s))
        );
        setShowModal(false);
      }
    } else {
      const { data, error } = await supabase
        .from("suppliers")
        .insert(payload)
        .select()
        .single();

      if (error) {
        alert("Gagal menambah supplier: " + error.message);
      } else {
        setSuppliers((prev) => [data as Supplier, ...prev]);
        setShowModal(false);
      }
    }
    setLoading(false);
    router.refresh();
  };

  const handleDelete = async (id: string, supplierName: string) => {
    if (!confirm(`Hapus supplier "${supplierName}"?`)) return;
    
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) {
      alert("Gagal menghapus supplier: " + error.message);
    } else {
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      router.refresh();
    }
  };

  return (
    <div style={{ padding: "1.5rem" }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Daftar Supplier</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            {suppliers.length} supplier terdaftar
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} />
          Tambah Supplier
        </button>
      </div>

      {/* Filter */}
      <div className="search-wrapper" style={{ marginBottom: "1.25rem" }}>
        <Search size={16} />
        <input
          type="text"
          className="form-input search-input"
          placeholder="Cari nama supplier, alamat, atau email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nama Supplier</th>
              <th>Nomor HP</th>
              <th>Email</th>
              <th>Alamat</th>
              <th>Keterangan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                  <div className="empty-state">
                    <Truck size={40} />
                    <p style={{ fontWeight: 600 }}>Belum ada supplier</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredSuppliers.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 700 }}>{s.name}</td>
                  <td>{s.phone ?? "—"}</td>
                  <td>{s.email ?? "—"}</td>
                  <td style={{ fontSize: "0.8125rem", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.address ?? "—"}
                  </td>
                  <td style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    {s.notes ?? "—"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.375rem" }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>
                        <Pencil size={13} />
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm btn-icon"
                        style={{ width: 28, height: 28 }}
                        onClick={() => handleDelete(s.id, s.name)}
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editingSupplier ? "Edit Supplier" : "Tambah Supplier"}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Nama Supplier *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nama perusahaan atau perorangan..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nomor HP / Telepon</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: 08123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="supplier@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Alamat Kantor/Gudang</label>
                <textarea
                  className="form-input"
                  placeholder="Alamat lengkap supplier..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Keterangan / Catatan</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Catatan tambahan (opsional)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                  {loading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
