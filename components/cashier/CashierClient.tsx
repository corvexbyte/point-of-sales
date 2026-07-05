// components/cashier/CashierClient.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import type { Category, Product } from "@/types/pos.types";
import ProductGrid from "./ProductGrid";
import Cart from "./Cart";
import { Search, Calendar } from "lucide-react";

interface Props {
  products: Product[];
  categories: Category[];
}

export default function CashierClient({ products, categories }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDateTime, setCurrentDateTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateTime(
        new Intl.DateTimeFormat("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(now)
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory =
        selectedCategory === "all" || p.category_id === selectedCategory;
      const matchSearch = p.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <div className="cashier-layout" style={{ height: "100vh" }}>
      {/* Left: Products */}
      <div className="cashier-products" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        
        {/* Upper Header: Greetings & Date */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--surface-border)", paddingBottom: "1rem" }}>
          <div>
            <h1 className="page-title" style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>
              Menu Transaksi
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem", marginTop: "2px" }}>
              Kelola pesanan pelanggan dengan cepat & aman
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--surface-1)", border: "1px solid var(--surface-border)", padding: "0.5rem 0.875rem", borderRadius: "10px" }}>
            <Calendar size={14} color="var(--primary-light)" />
            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 500 }}>
              {currentDateTime || "Loading..."}
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="search-wrapper">
          <Search size={18} style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            className="form-input search-input"
            style={{ 
              background: "var(--surface-1)", 
              borderColor: "var(--surface-border)",
              borderRadius: "12px",
              paddingTop: "0.75rem",
              paddingBottom: "0.75rem",
              fontSize: "0.875rem",
            }}
            placeholder="Cari produk berdasarkan nama atau SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Kategori Produk
          </p>
          <div className="category-tabs" style={{ marginBottom: 0 }}>
            <button
              className={`category-tab ${selectedCategory === "all" ? "active" : ""}`}
              onClick={() => setSelectedCategory("all")}
            >
              Semua Produk ({products.length})
            </button>
            {categories.map((cat) => {
              const count = products.filter(p => p.category_id === cat.id).length;
              return (
                <button
                  key={cat.id}
                  className={`category-tab ${selectedCategory === cat.id ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <ProductGrid products={filteredProducts} />
        </div>
      </div>

      {/* Right: Cart */}
      <div className="cashier-cart">
        <Cart />
      </div>
    </div>
  );
}
