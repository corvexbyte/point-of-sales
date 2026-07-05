// app/api/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { CheckoutPayload } from "@/types/pos.types";

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();

  // 1. Validasi session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload: CheckoutPayload = await request.json();
  const { items, subtotal, taxAmount, discountAmount, totalAmount, payment, notes } = payload;

  if (!items?.length || !payment) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // 2. Verifikasi stok real-time
  const productIds = items.map((i) => i.product.id);
  const { data: dbProducts, error: stockError } = await supabase
    .from("products")
    .select("id, stock, name")
    .in("id", productIds);

  if (stockError || !dbProducts) {
    return NextResponse.json(
      { error: "Gagal memvalidasi stok" },
      { status: 500 }
    );
  }

  for (const item of items) {
    const dbProduct = dbProducts.find((p) => p.id === item.product.id);
    if (!dbProduct) {
      return NextResponse.json(
        { error: `Produk tidak ditemukan: ${item.product.name}` },
        { status: 400 }
      );
    }
    if (dbProduct.stock < item.quantity) {
      return NextResponse.json(
        {
          error: `Stok tidak cukup untuk: ${dbProduct.name} (sisa ${dbProduct.stock})`,
        },
        { status: 400 }
      );
    }
  }

  // 3. Insert transaksi
  const { data: transaction, error: txError } = await supabase
    .from("transactions")
    .insert({
      cashier_id: user.id,
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      paid_amount: payment.paidAmount,
      payment_method: payment.method,
      status: "completed",
      notes: notes || null,
    })
    .select("id, invoice_number")
    .single();

  if (txError || !transaction) {
    return NextResponse.json(
      { error: `Gagal membuat transaksi: ${txError?.message}` },
      { status: 500 }
    );
  }

  // 4. Insert transaction items (trigger DB kurangi stok)
  const transactionItems = items.map((item) => ({
    transaction_id: transaction.id,
    product_id: item.product.id,
    product_name: item.product.name,
    product_price: item.product.price,
    quantity: item.quantity,
  }));

  const { error: itemsError } = await supabase
    .from("transaction_items")
    .insert(transactionItems);

  if (itemsError) {
    return NextResponse.json(
      { error: `Gagal menyimpan item: ${itemsError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    transactionId: transaction.id,
    invoiceNumber: transaction.invoice_number,
  });
}
