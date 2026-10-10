import "server-only";

import { prisma } from "@/lib/db/prisma";
import { hashAccessToken } from "@/lib/orders/access";

const TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/;
const NUMBER_RE = /^[A-Z0-9-]{8,30}$/;

/**
 * Mengembalikan pesanan hanya jika nomor DAN token cocok.
 * Kolom internal (catatan admin, hash token) tidak pernah diambil.
 */
export async function getOrderForCustomer(
  orderNumber: string,
  token: string | undefined
) {
  if (!token || !TOKEN_RE.test(token) || !NUMBER_RE.test(orderNumber)) {
    return null;
  }

  return prisma.order.findFirst({
    where: { orderNumber, accessTokenHash: hashAccessToken(token) },
    select: {
      orderNumber: true,
      customerName: true,
      note: true,
      customerNote: true,
      status: true,
      paymentStatus: true,
      fulfillmentStatus: true,
      subtotal: true,
      total: true,
      dpPercentage: true,
      dpAmount: true,
      paidAmount: true,
      cancelReason: true,
      createdAt: true,
      items: {
        select: {
          id: true,
          productName: true,
          brandName: true,
          size: true,
          unitPrice: true,
          quantity: true,
          lineTotal: true,
          imageUrl: true,
        },
      },
    },
  });
}