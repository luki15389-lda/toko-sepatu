import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { logActivity } from "@/lib/admin/activity";
import { ORDER_STATUS_LABEL } from "@/lib/order-labels";
import { canTransition, type OrderStatusValue } from "@/lib/orders/status-flow";

export class TransitionError extends Error {}

const label = (s: string) => ORDER_STATUS_LABEL[s] ?? s;

type FulfillmentValue = "NOT_READY" | "READY_FOR_PICKUP" | "PICKED_UP" | "CANCELLED";

export async function changeOrderStatusService(input: {
  orderId: string;
  adminId: string;
  toStatus: OrderStatusValue;
  note: string;
}): Promise<{ orderNumber: string }> {
  const { orderId, adminId, toStatus, note } = input;

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        orderNumber: true,
        status: true,
        paymentStatus: true,
        fulfillmentStatus: true,
        total: true,
        paidAmount: true,
      },
    });
    if (!order) throw new TransitionError("Pesanan tidak ditemukan.");

    if (toStatus === "CANCELLED") {
      throw new TransitionError("Gunakan tombol Batalkan pesanan untuk membatalkan.");
    }
    if (!canTransition(order.status, toStatus)) {
      throw new TransitionError(
        `Status tidak bisa diubah dari "${label(order.status)}" ke "${label(toStatus)}".`
      );
    }
    if (
      toStatus === "COMPLETED" &&
      (order.paymentStatus !== "PAID" || order.paidAmount < order.total)
    ) {
      throw new TransitionError(
        "Pesanan belum lunas. Catat pembayaran lunas yang sudah diverifikasi sebelum menyelesaikan pesanan."
      );
    }

    const nextFulfillment: FulfillmentValue =
      toStatus === "READY_FOR_PICKUP"
        ? "READY_FOR_PICKUP"
        : toStatus === "COMPLETED"
          ? "PICKED_UP"
          : order.fulfillmentStatus;

    // Compare-and-set: hanya berhasil jika status belum berubah oleh orang lain
    const updated = await tx.order.updateMany({
      where: { id: orderId, status: order.status },
      data: {
        status: toStatus,
        fulfillmentStatus: nextFulfillment,
        ...(toStatus === "COMPLETED" ? { completedAt: new Date() } : {}),
      },
    });
    if (updated.count !== 1) {
      throw new TransitionError(
        "Status pesanan baru saja berubah. Muat ulang halaman lalu coba lagi."
      );
    }

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        kind: "ORDER",
        fromValue: order.status,
        toValue: toStatus,
        changedById: adminId,
        note: note || null,
        visibleToCustomer: true,
      },
    });
    if (nextFulfillment !== order.fulfillmentStatus) {
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          kind: "FULFILLMENT",
          fromValue: order.fulfillmentStatus,
          toValue: nextFulfillment,
          changedById: adminId,
          visibleToCustomer: true,
        },
      });
    }

    await logActivity(tx, {
      adminId,
      action: "order.status_change",
      entityType: "Order",
      entityId: orderId,
      metadata: { orderNumber: order.orderNumber, from: order.status, to: toStatus },
    });

    return { orderNumber: order.orderNumber };
  });
}

export async function cancelOrderService(input: {
  orderId: string;
  adminId: string;
  reason: string;
}): Promise<{ orderNumber: string }> {
  const { orderId, adminId, reason } = input;

  try {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: {
          orderNumber: true,
          status: true,
          paymentStatus: true,
          fulfillmentStatus: true,
          items: { select: { id: true, variantId: true, quantity: true } },
        },
      });
      if (!order) throw new TransitionError("Pesanan tidak ditemukan.");

      if (!canTransition(order.status, "CANCELLED")) {
        throw new TransitionError(
          "Pesanan ini sudah selesai atau sudah dibatalkan, sehingga tidak bisa dibatalkan."
        );
      }

      const now = new Date();
      const nextPayment =
        order.paymentStatus === "UNPAID" ? "PAYMENT_CANCELLED" : order.paymentStatus;

      // Compare-and-set sekaligus penanda "stok sudah dikembalikan".
      // Hanya SATU pembatalan yang bisa lolos, meski dua admin menekan bersamaan.
      const updated = await tx.order.updateMany({
        where: { id: orderId, status: order.status, stockReleasedAt: null },
        data: {
          status: "CANCELLED",
          fulfillmentStatus: "CANCELLED",
          paymentStatus: nextPayment,
          cancelReason: reason,
          cancelledAt: now,
          stockReleasedAt: now,
        },
      });
      if (updated.count !== 1) {
        throw new TransitionError(
          "Pesanan baru saja berubah atau sudah dibatalkan. Muat ulang halaman."
        );
      }

      // Kembalikan stok per item (urut agar tidak saling kunci dengan pesanan lain)
      const items = [...order.items].sort((a, b) =>
        a.variantId < b.variantId ? -1 : 1
      );
      for (const item of items) {
        const rows = await tx.$queryRaw<{ stock: number }[]>`
          UPDATE "product_variants"
          SET "stock" = "stock" + ${item.quantity}::int, "updatedAt" = now()
          WHERE "id" = ${item.variantId}
          RETURNING "stock"
        `;
        if (rows.length !== 1) {
          throw new TransitionError("Gagal mengembalikan stok. Pembatalan dibatalkan.");
        }
        const after = rows[0].stock;

        // Aturan unik (orderItemId, type) menolak pencatatan kembar sebagai pengaman kedua
        await tx.inventoryMovement.create({
          data: {
            variantId: item.variantId,
            orderItemId: item.id,
            type: "ORDER_RELEASED",
            quantityChange: item.quantity,
            stockBefore: after - item.quantity,
            stockAfter: after,
            note: `Stok dikembalikan: pesanan ${order.orderNumber} dibatalkan`,
            createdById: adminId,
          },
        });
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          kind: "ORDER",
          fromValue: order.status,
          toValue: "CANCELLED",
          changedById: adminId,
          note: reason,
          visibleToCustomer: true,
        },
      });
      if (nextPayment !== order.paymentStatus) {
        await tx.orderStatusHistory.create({
          data: {
            orderId,
            kind: "PAYMENT",
            fromValue: order.paymentStatus,
            toValue: nextPayment,
            changedById: adminId,
            visibleToCustomer: true,
          },
        });
      }
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          kind: "FULFILLMENT",
          fromValue: order.fulfillmentStatus,
          toValue: "CANCELLED",
          changedById: adminId,
          visibleToCustomer: true,
        },
      });

      await logActivity(tx, {
        adminId,
        action: "order.cancel",
        entityType: "Order",
        entityId: orderId,
        metadata: { orderNumber: order.orderNumber, reason },
      });

      return { orderNumber: order.orderNumber };
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new TransitionError("Stok untuk pesanan ini sudah pernah dikembalikan.");
    }
    throw error;
  }
}