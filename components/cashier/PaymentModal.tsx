"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/utils/format";
import { X, CheckCircle, Banknote, QrCode, CreditCard, Send } from "lucide-react";
import type { CheckoutResult } from "@/types/pos.types";
import Receipt from "../transactions/Receipt";

interface Props {
  totalAmount: number;
  onClose: () => void;
}

type Step = "payment" | "success";

export default function PaymentModal({ totalAmount, onClose }: Props) {
  const router = useRouter();
  const [method, setMethod] = useState<"cash" | "qris" | "transfer" | "debit">("cash");
  const [paidAmount, setPaidAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<Step>("payment");
  const [result, setResult] = useState<CheckoutResult | null>(null);

  const checkout = useCartStore((s) => s.checkout);
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const taxAmount = useCartStore((s) => s.taxAmount);
  const discountAmount = useCartStore((s) => s.discountAmount);
  const clearCart = useCartStore((s) => s.clearCart);

  const paid = parseFloat(paidAmount) || 0;
  const change = paid - totalAmount;

  const quickAmounts = [
    totalAmount,
    Math.ceil(totalAmount / 10000) * 10000,
    Math.ceil(totalAmount / 50000) * 50000,
    Math.ceil(totalAmount / 100000) * 100000,
  ].filter((v, i, arr) => arr.indexOf(v) === i && v >= totalAmount);

  const handleCheckout = async () => {
    setError("");
    if (method === "cash" && paid < totalAmount) {
      setError("Jumlah bayar kurang dari total tagihan");
      return;
    }

    setLoading(true);
    const res = await checkout(
      method !== "cash" ? totalAmount : paid,
      method
    );

    if (!res.success) {
      setError(res.error || "Checkout gagal");
      setLoading(false);
      return;
    }

    setResult(res);
    router.refresh(); // Refresh Next.js server components in the background
    setStep("success");
    setLoading(false);
  };

  if (step === "success" && result) {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <div
            style={{
              textAlign: "center",
              paddingBottom: "1rem",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                background: "rgba(16,185,129,0.15)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem",
              }}
            >
              <CheckCircle size={32} color="var(--success)" />
            </div>
            <h2
              style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: 4 }}
            >
              Transaksi Berhasil!
            </h2>
            <p
              style={{
                color: "var(--muted-foreground)",
                fontSize: "0.875rem",
                marginBottom: "1.5rem",
              }}
            >
              {result.invoiceNumber}
            </p>

            <Receipt
              invoiceNumber={result.invoiceNumber!}
              items={items}
              subtotal={subtotal}
              taxAmount={taxAmount}
              discountAmount={discountAmount}
              totalAmount={totalAmount}
              paidAmount={method !== "cash" ? totalAmount : paid}
              changeAmount={method !== "cash" ? 0 : change}
              paymentMethod={method}
            />

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                marginTop: "1.25rem",
              }}
            >
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => window.print()}
              >
                🖨️ Cetak Struk
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => {
                  clearCart();
                  onClose();
                }}
              >
                Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Pembayaran</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Total */}
        <div
          style={{
            background: "var(--secondary)",
            borderRadius: 10,
            padding: "1rem",
            textAlign: "center",
            marginBottom: "1.25rem",
          }}
        >
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--muted-foreground)",
              marginBottom: 4,
            }}
          >
            Total Tagihan
          </p>
          <p style={{ fontSize: "2rem", fontWeight: 800, color: "var(--primary)" }}>
            {formatCurrency(totalAmount)}
          </p>
        </div>

        {/* Method */}
        <div style={{ marginBottom: "1.25rem" }}>
          <p className="form-label" style={{ marginBottom: "0.5rem" }}>
            Metode Pembayaran
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            {[
              { id: "cash", label: "Tunai", icon: <Banknote size={16} /> },
              { id: "qris", label: "QRIS", icon: <QrCode size={16} /> },
              { id: "debit", label: "Debit", icon: <CreditCard size={16} /> },
              { id: "transfer", label: "Transfer", icon: <Send size={16} /> }
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id as any)}
                style={{
                  padding: "0.75rem",
                  borderRadius: 8,
                  border: `2px solid ${method === m.id ? "var(--primary)" : "var(--surface-border)"}`,
                  background:
                    method === m.id ? "rgba(79, 70, 229, 0.08)" : "var(--surface-1)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  color: method === m.id ? "var(--primary)" : "var(--text-secondary)",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  transition: "all 0.15s",
                }}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cash Input */}
        {method === "cash" && (
          <div style={{ marginBottom: "1.25rem" }}>
            <div className="form-group" style={{ marginBottom: "0.75rem" }}>
              <label className="form-label">Jumlah Bayar</label>
              <input
                type="number"
                className="form-input"
                placeholder="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                style={{ fontSize: "1.25rem", fontWeight: 700 }}
              />
            </div>

            {/* Quick amounts */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.375rem",
              }}
            >
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPaidAmount(String(amount))}
                >
                  {formatCurrency(amount)}
                </button>
              ))}
            </div>

            {paid >= totalAmount && (
              <div
                style={{
                  marginTop: "0.75rem",
                  padding: "0.625rem",
                  background: "rgba(5, 150, 105, 0.08)",
                  border: "1px solid rgba(5, 150, 105, 0.15)",
                  borderRadius: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.875rem",
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>Kembalian</span>
                <span style={{ fontWeight: 700, color: "var(--success)" }}>
                  {formatCurrency(change)}
                </span>
              </div>
            )}
          </div>
        )}

        {method === "qris" && (
          <div
            style={{
              marginBottom: "1.25rem",
              textAlign: "center",
              padding: "1.5rem",
              background: "var(--surface-2)",
              borderRadius: 10,
              border: "1px solid var(--surface-border)",
            }}
          >
            <QrCode size={80} color="var(--text-muted)" style={{ margin: "0 auto 0.75rem" }} />
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              Tunjukkan QRIS kepada pelanggan
            </p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: 4 }}>
              Scan dan pastikan pembayaran terkonfirmasi di EDC/Sistem
            </p>
          </div>
        )}

        {method === "debit" && (
          <div
            style={{
              marginBottom: "1.25rem",
              textAlign: "center",
              padding: "1.5rem",
              background: "var(--surface-2)",
              borderRadius: 10,
              border: "1px solid var(--surface-border)",
            }}
          >
            <CreditCard size={80} color="var(--text-muted)" style={{ margin: "0 auto 0.75rem" }} />
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              Pembayaran Mesin EDC / Kartu Debit
            </p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: 4 }}>
              Gesek/masukkan kartu pada mesin EDC lalu verifikasi PIN pelanggan
            </p>
          </div>
        )}

        {method === "transfer" && (
          <div
            style={{
              marginBottom: "1.25rem",
              textAlign: "center",
              padding: "1.5rem",
              background: "var(--surface-2)",
              borderRadius: 10,
              border: "1px solid var(--surface-border)",
            }}
          >
            <Send size={80} color="var(--text-muted)" style={{ margin: "0 auto 0.75rem" }} />
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 600 }}>
              Pembayaran Transfer Bank
            </p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: 4 }}>
              Kirim ke Rekening BCA: <strong>123-456-7890</strong> a.n Toko POS
            </p>
          </div>
        )}

        {error && (
          <p
            style={{
              color: "var(--danger)",
              fontSize: "0.875rem",
              marginBottom: "0.75rem",
              padding: "0.625rem",
              background: "rgba(239,68,68,0.1)",
              borderRadius: 8,
            }}
          >
            {error}
          </p>
        )}

        <button
          className="btn btn-success btn-lg"
          style={{ width: "100%" }}
          onClick={handleCheckout}
          disabled={
            loading || (method === "cash" && paid < totalAmount)
          }
        >
          {loading ? (
            <>
              <span className="spinner" style={{ width: 18, height: 18 }} />
              Memproses...
            </>
          ) : (
            "Konfirmasi Pembayaran"
          )}
        </button>
      </div>
    </div>
  );
}
