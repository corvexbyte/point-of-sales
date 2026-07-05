// components/transactions/Receipt.tsx
"use client";

import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { CartItem } from "@/types/pos.types";

interface Props {
  invoiceNumber: string;
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: string;
  createdAt?: string;
  cashierName?: string;
  shopName?: string;
  shopAddress?: string;
  shopPhone?: string;
  receiptFooter?: string;
}

export default function Receipt({
  invoiceNumber,
  items,
  subtotal,
  taxAmount,
  discountAmount,
  totalAmount,
  paidAmount,
  changeAmount,
  paymentMethod,
  createdAt,
  cashierName,
  shopName = "TOKO SAYA",
  shopAddress = "Jl. Contoh No. 123",
  shopPhone = "Telp: 021-1234567",
  receiptFooter = "Terima kasih atas kunjungan Anda!",
}: Props) {
  const dateStr = createdAt ? formatDate(createdAt) : formatDate(new Date().toISOString());

  const getMethodLabel = (method: string) => {
    if (method === "cash") return "Tunai";
    if (method === "qris") return "QRIS";
    if (method === "debit") return "Debit";
    if (method === "transfer") return "Transfer";
    return method.toUpperCase();
  };

  return (
    <div className="receipt">
      {/* Header */}
      <div style={{ textAlign: "center", borderBottom: "1px dashed #000", paddingBottom: 8, marginBottom: 8 }}>
        <p style={{ fontWeight: "bold", fontSize: 14 }}>{shopName.toUpperCase()}</p>
        <p>{shopAddress}</p>
        <p>{shopPhone}</p>
      </div>

      {/* Invoice Info */}
      <div style={{ marginBottom: 8 }}>
        <p>{invoiceNumber}</p>
        <p>{dateStr}</p>
        {cashierName && <p>Kasir: {cashierName}</p>}
      </div>

      <div style={{ borderTop: "1px dashed #000", paddingTop: 8, marginBottom: 8 }} />

      {/* Items */}
      {items.map((item) => (
        <div key={item.product.id} style={{ marginBottom: 4 }}>
          <p>{item.product.name}</p>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>
              {item.quantity} x {formatCurrency(item.product.price)}
            </span>
            <span>{formatCurrency(item.product.price * item.quantity)}</span>
          </div>
        </div>
      ))}

      <div style={{ borderTop: "1px dashed #000", paddingTop: 8, marginTop: 8 }} />

      {/* Totals */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <span>Subtotal</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
      {discountAmount > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
          <span>Diskon</span>
          <span>-{formatCurrency(discountAmount)}</span>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <span>PPN 11%</span>
        <span>{formatCurrency(taxAmount)}</span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontWeight: "bold",
          borderTop: "1px dashed #000",
          paddingTop: 4,
          marginTop: 4,
          marginBottom: 4,
          fontSize: 14,
        }}
      >
        <span>TOTAL</span>
        <span>{formatCurrency(totalAmount)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <span>Bayar ({getMethodLabel(paymentMethod)})</span>
        <span>{formatCurrency(paidAmount)}</span>
      </div>
      {paymentMethod === "cash" && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
          <span>Kembalian</span>
          <span>{formatCurrency(changeAmount)}</span>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          borderTop: "1px dashed #000",
          paddingTop: 8,
          marginTop: 8,
        }}
      >
        <p>{receiptFooter}</p>
      </div>
    </div>
  );
}
