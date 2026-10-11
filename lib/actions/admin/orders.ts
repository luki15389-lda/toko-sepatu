"use server";

import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireAdminAction } from "@/lib/auth/session";
import { logActivity } from "@/lib/admin/activity";
import {
  cancelOrderService,
  changeOrderStatusService,
  TransitionError,
} from "@/lib/orders/transitions";
import {
  cancelSchema,
  notesSchema,
  statusChangeSchema,
} from "@/lib/validations/order-admin";
import { fail, succeed, type ActionResult } from "@/lib/actions/admin/types";

function refreshOrder(orderId: string) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function changeOrderStatus(
  orderId: string,
  toStatus: string,
  note: string
): Promise<ActionResult> {
  const admin = await requireAdminAction();

  const parsed = statusChangeSchema.safeParse({ toStatus, note });
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  try {
    await changeOrderStatusService({
      orderId,
      adminId: admin.id,
      toStatus: parsed.data.toStatus,
      note: parsed.data.note,
    });
  } catch (error) {
    if (error instanceof TransitionError) return fail(error.message);
    throw error;
  }

  refreshOrder(orderId);
  return succeed("Status pesanan diperbarui.");
}

export async function cancelOrder(
  orderId: string,
  reason: string
): Promise<ActionResult> {
  const admin = await requireAdminAction();

  const parsed = cancelSchema.safeParse({ reason });
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Alasan tidak valid.");
  }

  try {
    await cancelOrderService({
      orderId,
      adminId: admin.id,
      reason: parsed.data.reason,
    });
  } catch (error) {
    if (error instanceof TransitionError) return fail(error.message);
    throw error;
  }

  // Stok kembali: segarkan katalog publik dan produk terlaris
  updateTag("products");
  updateTag("orders");
  refreshOrder(orderId);
  return succeed("Pesanan dibatalkan dan stok dikembalikan.");
}

export async function saveOrderNotes(
  orderId: string,
  values: { customerNote: string; adminNote: string }
): Promise<ActionResult> {
  const admin = await requireAdminAction();

  const parsed = notesSchema.safeParse(values);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Catatan tidak valid.");
  }

  const exists = await prisma.order.findUnique({
    where: { id: orderId },
    select: { orderNumber: true },
  });
  if (!exists) return fail("Pesanan tidak ditemukan.");

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        customerNote: parsed.data.customerNote || null,
        adminNote: parsed.data.adminNote || null,
      },
    });
    await logActivity(tx, {
      adminId: admin.id,
      action: "order.notes_update",
      entityType: "Order",
      entityId: orderId,
      metadata: { orderNumber: exists.orderNumber },
    });
  });

  refreshOrder(orderId);
  return succeed("Catatan disimpan.");
}