// components/cashier/Cart.tsx
"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/utils/format";
import { ShoppingCart, Trash2, X, Receipt, Minus, Plus } from "lucide-react";
import PaymentModal from "./PaymentModal";

export default function Cart() {
  const [showPayment, setShowPayment] = useState(false);
  const {
    items,
    subtotal,
    taxAmount,
    discountAmount,
    totalAmount,
    itemCount,
    removeItem,
    updateQuantity,
    clearCart,
    setItemDiscount,
    setTransactionDiscount,
    transactionDiscountType,
    transactionDiscountValue,
  } = useCartStore();

  return (
    <>
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{
          padding: "1.125rem 1.25rem",
          borderBottom: "1px solid var(--surface-border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(255,255,255,0.02)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: "rgba(79, 70, 229, 0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ShoppingCart size={16} color="var(--primary)" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>Keranjang</p>
              {itemCount > 0 && (
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  {itemCount} item • {formatCurrency(subtotal)}
                </p>
              )}
            </div>
          </div>
          {items.length > 0 && (
            <button onClick={clearCart} className="btn btn-ghost btn-sm"
              style={{ color: "var(--danger)", fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}>
              <Trash2 size={13} /> Hapus Semua
            </button>
          )}
        </div>

        {/* Item List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0.875rem 1rem" }}>
          {items.length === 0 ? (
            <div className="empty-state" style={{ padding: "3rem 1rem" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "var(--surface-2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "0.5rem",
              }}>
                <ShoppingCart size={28} style={{ opacity: 0.3 }} />
              </div>
              <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>Keranjang kosong</p>
              <p style={{ fontSize: "0.8125rem", maxWidth: 180, lineHeight: 1.5 }}>
                Klik produk di sebelah kiri untuk menambahkan
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {items.map((item, i) => (
                <div key={item.product.id} style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  padding: "0.75rem 0.875rem",
                  background: "var(--surface-1)",
                  border: "1px solid var(--surface-border)",
                  borderRadius: 10,
                  animation: "slideUp 0.15s ease",
                  animationDelay: `${i * 30}ms`, animationFillMode: "both",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                    {/* Number badge */}
                    <div style={{
                      width: 24, height: 24, borderRadius: 6,
                      background: "var(--surface-2)", border: "1px solid var(--surface-border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)",
                      flexShrink: 0,
                    }}>
                      {i + 1}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: "0.8125rem", fontWeight: 600,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>
                        {item.product.name}
                      </p>
                      <p style={{
                        fontSize: "0.75rem", fontWeight: 700,
                        color: "var(--primary)"
                      }}>
                        {formatCurrency(item.product.price)}
                      </p>
                    </div>

                    {/* Qty */}
                    <div className="qty-control">
                      <button className="qty-btn" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                        <Minus size={11} />
                      </button>
                      <span className="qty-display">{item.quantity}</span>
                      <button className="qty-btn"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}>
                        <Plus size={11} />
                      </button>
                    </div>

                    {/* Remove */}
                    <button className="btn btn-ghost btn-icon"
                      onClick={() => removeItem(item.product.id)}
                      style={{ width: 28, height: 28, color: "var(--text-muted)", flexShrink: 0 }}>
                      <X size={13} />
                    </button>
                  </div>

                  {/* Item Discount Controls */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingLeft: "2rem", borderTop: "1px dashed var(--surface-border)", paddingTop: "0.375rem" }}>
                    <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", fontWeight: 500 }}>Diskon Item:</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <input
                        type="number"
                        placeholder="0"
                        style={{
                          width: 60,
                          fontSize: "0.75rem",
                          padding: "2px 6px",
                          border: "1px solid var(--surface-border)",
                          borderRadius: 4,
                          background: "var(--surface-2)",
                          color: "var(--text-primary)",
                          outline: "none"
                        }}
                        value={item.discountValue || ""}
                        onChange={(e) => setItemDiscount(item.product.id, item.discountType || "nominal", Number(e.target.value))}
                      />
                      <select
                        style={{
                          fontSize: "0.75rem",
                          padding: "2px 4px",
                          border: "1px solid var(--surface-border)",
                          borderRadius: 4,
                          background: "var(--surface-2)",
                          color: "var(--text-secondary)",
                          cursor: "pointer"
                        }}
                        value={item.discountType || "nominal"}
                        onChange={(e) => setItemDiscount(item.product.id, e.target.value as "percentage" | "nominal", item.discountValue || 0)}
                      >
                        <option value="nominal">Rp</option>
                        <option value="percentage">%</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary & Checkout */}
        <div style={{
          borderTop: "1px solid var(--surface-border)",
          padding: "1rem 1.25rem",
          background: "rgba(0,0,0,0.01)",
        }}>
          {/* Transaction Discount Form */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.75rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--surface-border)" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)" }}>Diskon Transaksi:</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <input
                type="number"
                placeholder="0"
                style={{
                  width: 80,
                  fontSize: "0.75rem",
                  padding: "4px 8px",
                  border: "1px solid var(--surface-border)",
                  borderRadius: 6,
                  background: "var(--surface-2)",
                  color: "var(--text-primary)",
                  outline: "none"
                }}
                value={transactionDiscountValue || ""}
                onChange={(e) => setTransactionDiscount(transactionDiscountType, Number(e.target.value))}
              />
              <select
                style={{
                  fontSize: "0.75rem",
                  padding: "4px 6px",
                  border: "1px solid var(--surface-border)",
                  borderRadius: 6,
                  background: "var(--surface-2)",
                  color: "var(--text-secondary)",
                  cursor: "pointer"
                }}
                value={transactionDiscountType}
                onChange={(e) => setTransactionDiscount(e.target.value as "percentage" | "nominal", transactionDiscountValue)}
              >
                <option value="nominal">Rp</option>
                <option value="percentage">%</option>
              </select>
            </div>
          </div>

          {/* Summary rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", marginBottom: "0.875rem" }}>
            {[
              { label: "Subtotal", value: formatCurrency(subtotal), muted: true },
              discountAmount > 0 && { label: "Diskon", value: `−${formatCurrency(discountAmount)}`, color: "#059669" },
              { label: "PPN 11%", value: formatCurrency(taxAmount), muted: true },
            ].filter(Boolean).map((row: any) => (
              <div key={row.label} style={{
                display: "flex", justifyContent: "space-between",
                fontSize: "0.8125rem",
                color: row.color ?? (row.muted ? "var(--text-muted)" : "var(--text-primary)"),
              }}>
                <span>{row.label}</span>
                <span>{row.value}</span>
              </div>
            ))}

            {/* Total */}
            <div style={{
              display: "flex", justifyContent: "space-between",
              paddingTop: "0.625rem", marginTop: "0.25rem",
              borderTop: "1px solid var(--surface-border)",
            }}>
              <span style={{ fontWeight: 800, fontSize: "1rem" }}>TOTAL</span>
              <span style={{
                fontWeight: 800, fontSize: "1.125rem",
                color: "var(--primary)",
              }}>
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          {/* Pay Button */}
          <button
            className="btn btn-success btn-lg"
            style={{ width: "100%", gap: "0.5rem", letterSpacing: "0.02em" }}
            disabled={items.length === 0}
            onClick={() => setShowPayment(true)}
          >
            <Receipt size={18} />
            Bayar Sekarang
          </button>
        </div>
      </div>

      {showPayment && (
        <PaymentModal totalAmount={totalAmount} onClose={() => setShowPayment(false)} />
      )}
    </>
  );
}
