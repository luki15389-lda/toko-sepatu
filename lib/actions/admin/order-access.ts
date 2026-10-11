"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireAdminAction } from "@/lib/auth/session";
import { logActivity } from "@/lib/admin/activity";
import { generateAccessToken, hashAccessToken } from "@/lib/orders/access";

type Result =
  | { ok: true; message: string; url: string }
  | { ok: false; message: string };

export async function regenerateAccessLink(orderId: string): Promise<Result> {
  const admin = await requireAdminAction();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { orderNumber: true },
  });
  if (!order) return { ok: false, message: "Pesanan tidak ditemukan." };

  const token = generateAccessToken();

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { accessTokenHash: hashAccessToken(token) },
    });
    await logActivity(tx, {
      adminId: admin.id,
      action: "order.access_link",
      entityType: "Order",
      entityId: orderId,
      metadata: { orderNumber: order.orderNumber },
    });
  });

  revalidatePath(`/admin/orders/${orderId}`);

  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return {
    ok: true,
    message: "Tautan baru dibuat. Tautan lama tidak berlaku lagi.",
    url: `${base}/orders/${order.orderNumber}?t=${token}`,
  };
}