// components/audit/AuditClient.tsx
"use client";

import { useState, useMemo } from "react";
import { formatDate } from "@/lib/utils/format";
import { ClipboardList, Search } from "lucide-react";

interface AuditLog {
  id: string;
  user_id: string | null;
  activity: string;
  details: string | null;
  created_at: string;
  profiles: { full_name: string } | null;
}

interface Props {
  initialLogs: AuditLog[];
}

export default function AuditClient({ initialLogs }: Props) {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [search, setSearch] = useState("");

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const name = l.profiles?.full_name || "Sistem";
      const matchSearch =
        l.activity.toLowerCase().includes(search.toLowerCase()) ||
        name.toLowerCase().includes(search.toLowerCase()) ||
        (l.details && l.details.toLowerCase().includes(search.toLowerCase()));
      return matchSearch;
    });
  }, [logs, search]);

  return (
    <div style={{ padding: "1.5rem" }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Log Aktivitas</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Catatan seluruh aktivitas dan tindakan keamanan yang dilakukan oleh pengguna sistem
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="search-wrapper" style={{ marginBottom: "1.25rem" }}>
        <Search size={16} />
        <input
          type="text"
          className="form-input search-input"
          placeholder="Cari aktivitas, nama pengguna, atau kata kunci log..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Logs Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Pengguna</th>
              <th>Aktivitas</th>
              <th>Rincian Detail</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                  <div className="empty-state">
                    <ClipboardList size={40} />
                    <p style={{ fontWeight: 600 }}>Belum ada log aktivitas</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: "0.8125rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {formatDate(log.created_at)}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {log.profiles?.full_name ?? "Sistem"}
                  </td>
                  <td>
                    <span className="badge badge-muted" style={{ textTransform: "uppercase", fontSize: "0.7rem" }}>
                      {log.activity}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                    {log.details ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
