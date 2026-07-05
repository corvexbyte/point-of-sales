// store/cartStore.ts
"use client";

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type {
  CartItem,
  Product,
  CheckoutPayload,
  CheckoutResult,
} from "@/types/pos.types";

const TAX_RATE = 0.11;

function computeTotals(
  items: CartItem[],
  txDiscountType: "percentage" | "nominal",
  txDiscountValue: number
) {
  // 1. Compute subtotal, applying item discounts
  const subtotal = items.reduce((sum, item) => {
    const originalPrice = item.product.price * item.quantity;
    let itemDiscount = 0;
    if (item.discountType === "percentage" && item.discountValue) {
      itemDiscount = Math.round(originalPrice * (item.discountValue / 100));
    } else if (item.discountType === "nominal" && item.discountValue) {
      itemDiscount = item.discountValue * item.quantity;
    }
    return sum + (originalPrice - itemDiscount);
  }, 0);

  // 2. Compute transaction-wide discount
  let discountAmount = 0;
  if (txDiscountType === "percentage") {
    discountAmount = Math.round(subtotal * (txDiscountValue / 100));
  } else {
    discountAmount = txDiscountValue;
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(taxableAmount * TAX_RATE);
  const totalAmount = taxableAmount + taxAmount;

  return { subtotal, taxAmount, totalAmount, discountAmount };
}

interface CartState {
  items: CartItem[];
  transactionDiscountType: "percentage" | "nominal";
  transactionDiscountValue: number;
  discountAmount: number;
  notes: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  itemCount: number;

  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setItemDiscount: (
    productId: string,
    type: "percentage" | "nominal",
    value: number
  ) => void;
  setTransactionDiscount: (
    type: "percentage" | "nominal",
    value: number
  ) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
  checkout: (
    paidAmount: number,
    method: "cash" | "qris" | "transfer" | "debit"
  ) => Promise<CheckoutResult>;
}

export const useCartStore = create<CartState>()(
  devtools(
    persist(
      (set, get) => ({
        items: [],
        transactionDiscountType: "nominal",
        transactionDiscountValue: 0,
        discountAmount: 0,
        notes: "",
        subtotal: 0,
        taxAmount: 0,
        totalAmount: 0,
        itemCount: 0,

        addItem: (product: Product) => {
          const { items, transactionDiscountType, transactionDiscountValue } = get();
          const existingIndex = items.findIndex(
            (i) => i.product.id === product.id
          );
          let nextItems: CartItem[];

          if (existingIndex >= 0) {
            nextItems = items.map((item, idx) =>
              idx === existingIndex
                ? {
                    ...item,
                    quantity: Math.min(item.quantity + 1, product.stock),
                  }
                : item
            );
          } else {
            if (product.stock === 0) return;
            nextItems = [...items, { product, quantity: 1 }];
          }

          const totals = computeTotals(nextItems, transactionDiscountType, transactionDiscountValue);
          set({
            items: nextItems,
            itemCount: nextItems.reduce((sum, i) => sum + i.quantity, 0),
            ...totals,
          });
        },

        removeItem: (productId: string) => {
          const { items, transactionDiscountType, transactionDiscountValue } = get();
          const nextItems = items.filter((i) => i.product.id !== productId);
          const totals = computeTotals(nextItems, transactionDiscountType, transactionDiscountValue);
          set({
            items: nextItems,
            itemCount: nextItems.reduce((sum, i) => sum + i.quantity, 0),
            ...totals,
          });
        },

        updateQuantity: (productId: string, quantity: number) => {
          const { items, transactionDiscountType, transactionDiscountValue } = get();
          if (quantity <= 0) {
            get().removeItem(productId);
            return;
          }
          const nextItems = items.map((item) =>
            item.product.id === productId
              ? { ...item, quantity: Math.min(quantity, item.product.stock) }
              : item
          );
          const totals = computeTotals(nextItems, transactionDiscountType, transactionDiscountValue);
          set({
            items: nextItems,
            itemCount: nextItems.reduce((sum, i) => sum + i.quantity, 0),
            ...totals,
          });
        },

        setItemDiscount: (productId: string, type: "percentage" | "nominal", value: number) => {
          const { items, transactionDiscountType, transactionDiscountValue } = get();
          const nextItems = items.map((item) =>
            item.product.id === productId
              ? { ...item, discountType: type, discountValue: Math.max(0, value) }
              : item
          );
          const totals = computeTotals(nextItems, transactionDiscountType, transactionDiscountValue);
          set({
            items: nextItems,
            ...totals,
          });
        },

        setTransactionDiscount: (type: "percentage" | "nominal", value: number) => {
          const { items } = get();
          const val = Math.max(0, value);
          const totals = computeTotals(items, type, val);
          set({
            transactionDiscountType: type,
            transactionDiscountValue: val,
            ...totals,
          });
        },

        setNotes: (notes: string) => set({ notes }),

        clearCart: () =>
          set({
            items: [],
            transactionDiscountType: "nominal",
            transactionDiscountValue: 0,
            discountAmount: 0,
            notes: "",
            subtotal: 0,
            taxAmount: 0,
            totalAmount: 0,
            itemCount: 0,
          }),

        checkout: async (
          paidAmount: number,
          method: "cash" | "qris" | "transfer" | "debit"
        ): Promise<CheckoutResult> => {
          const {
            items,
            subtotal,
            taxAmount,
            discountAmount,
            totalAmount,
            notes,
          } = get();

          if (items.length === 0)
            return { success: false, error: "Keranjang kosong" };
          if (paidAmount < totalAmount)
            return { success: false, error: "Jumlah pembayaran kurang" };

          const payload: CheckoutPayload = {
            items,
            subtotal,
            taxAmount,
            discountAmount,
            totalAmount,
            payment: { method: method as any, paidAmount },
            notes,
          };

          try {
            const response = await fetch("/api/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            const result = await response.json();

            if (!response.ok)
              return {
                success: false,
                error: result.error || "Checkout gagal",
              };

            // Bersihkan cart akan ditangani oleh UI ketika menekan tombol "Transaksi Baru"
            return {
              success: true,
              transactionId: result.transactionId,
              invoiceNumber: result.invoiceNumber,
            };
          } catch {
            return { success: false, error: "Terjadi kesalahan jaringan" };
          }
        },
      }),
      {
        name: "pos-cart-storage",
        partialize: (state) => ({
          items: state.items,
          transactionDiscountType: state.transactionDiscountType,
          transactionDiscountValue: state.transactionDiscountValue,
          notes: state.notes,
        }),
      }
    )
  )
);
