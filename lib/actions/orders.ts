"use server";

import { headers } from "next/headers";
import { updateTag } from "next/cache";
import { checkoutSchema } from "@/lib/validations/order";
import {
  countPendingOrders,
  createOrder,
  type StockIssue,
} from "@/lib/orders/create-order";
import {
  countHits,
  getClientIp,
  recordHit,
  sign,
} from "@/lib/auth/rate-limit";

const ORDER_WINDOW_MS = 30 * 60 * 1000;
const MAX_ORDERS_PER_IP = 10;
const MAX_PENDING_PER_WHATSAPP = 5;

export type CheckoutState = {
  error?: string;
  fieldErrors?: { name?: string; whatsapp?: string; note?: string };
  values?: { name: string; whatsapp: string; note: string };
  issues?: StockIssue[];
  redirectTo?: string;
};

export async function createOrderAction(
  _prev: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const values = {
    name: String(formData.get("name") ?? ""),
    whatsapp: String(formData.get("whatsapp") ?? ""),
    note: String(formData.get("note") ?? ""),
  };

  let items: unknown;
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { values, error: "Data keranjang tidak valid. Muat ulang halaman." };
  }

  const parsed = checkoutSchema.safeParse({ ...values, items });
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return {
      values,
      fieldErrors: {
        name: flat.name?.[0],
        whatsapp: flat.whatsapp?.[0],
        note: flat.note?.[0],
      },
      error: flat.items?.[0],
    };
  }
  const data = parsed.data;

  // Pembatasan: cegah pesanan massal dari satu perangkat atau satu nomor
  const ipKey = sign(`order-ip:${getClientIp(await headers())}`);
  if ((await countHits(ipKey, ORDER_WINDOW_MS)) >= MAX_ORDERS_PER_IP) {
    return {
      values,
      error: "Terlalu banyak pesanan dalam waktu singkat. Coba lagi beberapa saat lagi.",
    };
  }
  if ((await countPendingOrders(data.whatsapp)) >= MAX_PENDING_PER_WHATSAPP) {
    return {
      values,
      error:
        "Nomor ini masih memiliki beberapa pesanan yang menunggu konfirmasi. Selesaikan dahulu lewat WhatsApp penjual.",
    };
  }
  await recordHit(ipKey);

  const result = await createOrder(data);
  if (!result.ok) {
    return { values, error: result.message, issues: result.issues };
  }

  // Stok berubah: segarkan data katalog dan produk terlaris
  updateTag("products");
  updateTag("orders");

  return {
    values,
    redirectTo: `/orders/${result.orderNumber}?t=${result.accessToken}`,
  };
}