// types/pos.types.ts

export type UserRole = "admin" | "cashier";
export type PaymentMethod = "cash" | "qris";
export type TransactionStatus = "pending" | "completed" | "voided";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  cost_price: number;
  stock: number;
  image_url: string | null;
  sku: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  categories?: { name: string } | null;
}

export interface Transaction {
  id: string;
  cashier_id: string;
  invoice_number: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  change_amount: number;
  payment_method: PaymentMethod;
  status: TransactionStatus;
  notes: string | null;
  created_at: string;
  profiles?: { full_name: string } | null;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discountType?: "percentage" | "nominal";
  discountValue?: number;
}

export interface PaymentDetails {
  method: PaymentMethod;
  paidAmount: number;
}

export interface CheckoutPayload {
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  payment: PaymentDetails;
  notes?: string;
}

export interface CheckoutResult {
  success: boolean;
  transactionId?: string;
  invoiceNumber?: string;
  error?: string;
}
