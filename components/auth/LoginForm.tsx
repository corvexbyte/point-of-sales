// components/auth/LoginForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ShoppingBag, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError("Email atau password salah. Silakan coba lagi.");
      setLoading(false);
      return;
    }

    router.push("/cashier");
    router.refresh();
  };

  return (
    <div className="login-page">
      {/* Animated background orbs */}
      <div style={{
        position: "absolute", top: "15%", left: "10%", width: 400, height: 400,
        background: "radial-gradient(circle, rgba(124,111,247,0.08) 0%, transparent 70%)",
        borderRadius: "50%", animation: "float 8s ease-in-out infinite", pointerEvents: "none"
      }} />
      <div style={{
        position: "absolute", bottom: "15%", right: "10%", width: 300, height: 300,
        background: "radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)",
        borderRadius: "50%", animation: "float 10s ease-in-out infinite reverse", pointerEvents: "none"
      }} />

      <div className="login-card">
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "2rem" }}>
          <div className="logo-icon">
            <ShoppingBag size={22} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <p style={{ fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.02em" }}>POS System</p>
            <p style={{ fontSize: "0.725rem", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Point of Sales
            </p>
          </div>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: "1.75rem" }}>
          <h1 style={{
            fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.04em",
            marginBottom: "0.375rem", lineHeight: 1.2
          }}>
            Selamat Datang 👋
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", lineHeight: 1.6 }}>
            Masuk ke akun Anda untuk memulai sesi kasir
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)",
            borderRadius: 10, padding: "0.75rem 1rem",
            display: "flex", alignItems: "center", gap: "0.625rem",
            marginBottom: "1.25rem", fontSize: "0.875rem", color: "var(--danger)",
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div style={{ position: "relative" }}>
              <Mail size={15} style={{
                position: "absolute", left: "0.875rem", top: "50%",
                transform: "translateY(-50%)", color: "var(--text-muted)"
              }} />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: "2.625rem" }}
                placeholder="kasir@toko.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={15} style={{
                position: "absolute", left: "0.875rem", top: "50%",
                transform: "translateY(-50%)", color: "var(--text-muted)"
              }} />
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                style={{ paddingLeft: "2.625rem", paddingRight: "2.875rem" }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                position: "absolute", right: "0.875rem", top: "50%",
                transform: "translateY(-50%)", background: "none", border: "none",
                cursor: "pointer", color: "var(--text-muted)", padding: 0, lineHeight: 0
              }}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: "100%", marginTop: "0.5rem", gap: "0.5rem" }}
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner" style={{ width: 18, height: 18 }} />Masuk...</>
            ) : (
              <>Masuk ke Sistem <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        <p style={{
          textAlign: "center", marginTop: "1.5rem",
          fontSize: "0.8125rem", color: "var(--text-muted)"
        }}>
          Belum punya akun?{" "}
          <span style={{ color: "var(--primary-light)", fontWeight: 600 }}>Hubungi administrator</span>
        </p>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
      `}</style>
    </div>
  );
}
