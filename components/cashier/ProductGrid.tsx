// components/cashier/ProductGrid.tsx
"use client";

import Image from "next/image";
import { Package, AlertCircle } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/utils/format";
import type { Product } from "@/types/pos.types";

interface Props {
  products: Product[];
}

export default function ProductGrid({ products }: Props) {
  const addItem = useCartStore((s) => s.addItem);

  if (products.length === 0) {
    return (
      <div className="empty-state" style={{ height: "100%", justifyContent: "center" }}>
        <Package size={52} style={{ color: "var(--text-muted)", marginBottom: "0.5rem" }} />
        <p style={{ fontWeight: 700, fontSize: "0.9375rem" }}>Tidak Ada Produk</p>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", maxWidth: 220, lineHeight: 1.5 }}>
          Coba cari kata kunci lain atau pilih kategori yang berbeda
        </p>
      </div>
    );
  }

  return (
    <div className="product-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "1rem" }}>
      {products.map((product) => {
        const isOutOfStock = product.stock === 0;
        const isLowStock = product.stock > 0 && product.stock <= 5;

        return (
          <div
            key={product.id}
            className={`product-card ${isOutOfStock ? "out-of-stock" : ""}`}
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
            onClick={() => !isOutOfStock && addItem(product)}
            title={isOutOfStock ? "Stok habis" : `Tambah ${product.name} ke keranjang`}
          >
            {/* Stock Level Badge Overlays */}
            {isOutOfStock && (
              <span className="badge badge-danger" style={{ position: "absolute", top: "8px", right: "8px", zIndex: 10, boxShadow: "0 4px 12px rgba(239, 68, 68, 0.4)" }}>
                Habis
              </span>
            )}
            {isLowStock && (
              <span className="badge badge-warning" style={{ position: "absolute", top: "8px", right: "8px", zIndex: 10, boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)" }}>
                Sisa {product.stock}
              </span>
            )}

            {/* Product Image Wrapper */}
            <div style={{ position: "relative", width: "100%", aspectRatio: "1.1", overflow: "hidden", background: "var(--surface-2)" }}>
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  style={{ objectFit: "cover", transition: "transform 0.3s ease" }}
                  sizes="200px"
                  className="product-image"
                />
              ) : (
                <div className="product-card-img-placeholder" style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Package size={34} style={{ color: "var(--text-muted)" }} />
                </div>
              )}
            </div>

            {/* Product Info Section */}
            <div className="product-card-body" style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between", gap: "0.5rem" }}>
              <div>
                <p className="product-card-name" style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 600 }}>
                  {product.name}
                </p>
                {product.sku && (
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px", fontFamily: "monospace" }}>
                    {product.sku}
                  </p>
                )}
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--surface-border)", paddingTop: "0.5rem", marginTop: "auto" }}>
                <p className="product-card-price" style={{ margin: 0, fontWeight: 800 }}>
                  {formatCurrency(product.price)}
                </p>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  Stok: <strong style={{ color: isOutOfStock ? "var(--danger)" : "var(--text-primary)" }}>{product.stock}</strong>
                </span>
              </div>
            </div>
            
            <style>{`
              .product-card:hover .product-image {
                transform: scale(1.08);
              }
            `}</style>
          </div>
        );
      })}
    </div>
  );
}
