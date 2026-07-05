// components/users/UsersClient.tsx
"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Search, X, Check, ShieldAlert, Key } from "lucide-react";
import type { Profile } from "@/types/pos.types";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils/format";

// Extend Profile with status if it's not defined
interface UserProfile extends Profile {
  status?: boolean;
}

interface Props {
  initialUsers: UserProfile[];
}

export default function UsersClient({ initialUsers }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"admin" | "cashier">("cashier");
  const [status, setStatus] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.role.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [users, search]);

  const openAdd = () => {
    setEditingUser(null);
    setEmail("");
    setPassword("");
    setFullName("");
    setRole("cashier");
    setStatus(true);
    setError("");
    setShowModal(true);
  };

  const openEdit = (user: UserProfile) => {
    setEditingUser(user);
    setEmail(""); // Email is not editable
    setPassword("");
    setFullName(user.full_name);
    setRole(user.role);
    setStatus(user.status ?? true);
    setError("");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (editingUser) {
      // Edit User Profile (Role & Status)
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          role,
          status,
        })
        .eq("id", editingUser.id);

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, full_name: fullName, role, status }
            : u
        )
      );
      setShowModal(false);
    } else {
      // Add New User via API to prevent logging out admin
      if (!email || !password) {
        setError("Email dan password wajib diisi");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: fullName, role }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Gagal membuat user");
        setLoading(false);
        return;
      }

      // Add to local state
      const newUser: UserProfile = {
        id: result.userId,
        full_name: fullName,
        role,
        status: true,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setUsers((prev) => [newUser, ...prev]);
      setShowModal(false);
    }
    setLoading(false);
    router.refresh();
  };

  const handleResetPassword = async (userEmail: string) => {
    if (!userEmail) {
      alert("Email user tidak ditemukan");
      return;
    }
    if (!confirm(`Kirim email tautan reset password ke ${userEmail}?`)) return;

    const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      alert("Gagal mengirim email reset: " + error.message);
    } else {
      alert("Email tautan reset password berhasil dikirim!");
    }
  };

  return (
    <div style={{ padding: "1.5rem" }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Manajemen User</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Kelola akses staf kasir dan administrator
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} />
          Tambah User
        </button>
      </div>

      {/* Filters */}
      <div className="search-wrapper" style={{ marginBottom: "1.25rem" }}>
        <Search size={16} />
        <input
          type="text"
          className="form-input search-input"
          placeholder="Cari user berdasarkan nama atau peran..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Users Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nama Lengkap</th>
              <th>Peran</th>
              <th>Status</th>
              <th>Daftar Pada</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                  Tidak ada user ditemukan.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 600 }}>{user.full_name}</td>
                  <td>
                    <span className={`badge ${user.role === "admin" ? "badge-primary" : "badge-muted"}`}>
                      {user.role === "admin" ? "Admin" : "Kasir"}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${(user.status ?? true) ? "badge-success" : "badge-danger"}`}>
                      {(user.status ?? true) ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    {formatDate(user.created_at)}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.375rem" }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(user)}>
                        <Pencil size={13} />
                        Edit
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
              <h2 className="modal-title">{editingUser ? "Edit User" : "Tambah User Baru"}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            {error && (
              <div style={{
                background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)",
                borderRadius: 8, padding: "0.75rem", marginBottom: "1rem", color: "var(--danger)",
                fontSize: "0.8125rem", display: "flex", gap: "0.5rem"
              }}>
                <ShieldAlert size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nama lengkap user..."
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              {!editingUser && (
                <>
                  <div className="form-group">
                    <label className="form-label">Email Staf</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="email@toko.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password Sementara</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Min 6 karakter..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Peran (Role)</label>
                <select
                  className="form-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value as "admin" | "cashier")}
                >
                  <option value="cashier">Kasir (Staf Penjualan)</option>
                  <option value="admin">Administrator (Akses Penuh)</option>
                </select>
              </div>

              {editingUser && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0" }}>
                  <input
                    type="checkbox"
                    id="status-checkbox"
                    checked={status}
                    onChange={(e) => setStatus(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: "pointer" }}
                  />
                  <label htmlFor="status-checkbox" className="form-label" style={{ margin: 0, cursor: "pointer" }}>
                    Akun Aktif (Dapat Login)
                  </label>
                </div>
              )}

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
