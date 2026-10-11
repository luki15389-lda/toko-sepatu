import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { logActivity } from "@/lib/admin/activity";
import { formatRupiah, todayWib } from "@/lib/utils";

export class PaymentError extends Error {}

type Tx = Prisma.TransactionClient;
type Method = "BANK_TRANSFER" | "CASH" | "OTHER";
type PaymentStatusValue =
  | "UNPAID"
  | "DP_PARTIAL"
  | "PAID"
  | "REFUNDED"
  | "PAYMENT_CANCELLED";

/** Mengunci baris pesanan sampai transaksi selesai: mencegah dua pencatatan bersamaan. */
async function lockOrder(tx: Tx, orderId: string) {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "orders" WHERE "id" = ${orderId} FOR UPDATE
  `;
  if (rows.length === 0) throw new PaymentError("Pesanan tidak ditemukan.");
}

/** Total terverifikasi dikurangi pengembalian dana. */
async function verifiedNet(tx: Tx, orderId: string): Promise<number> {
  const groups = await tx.payment.groupBy({
    by: ["kind"],
    where: { orderId, status: "VERIFIED" },
    _sum: { amount: true },
  });
  return groups.reduce(
    (net, g) => net + (g.kind === "REFUND" ? -1 : 1) * (g._sum.amount ?? 0),
    0
  );
}

/** Menghitung ulang paidAmount dan status pembayaran dari catatan terverifikasi. */
async function syncOrderPayment(tx: Tx, orderId: string, adminId: string) {
  const order = await tx.order.findUniqueOrThrow({
    where: { id: orderId },
    select: { total: true, status: true, paymentStatus: true },
  });
  const net = await verifiedNet(tx, orderId);
  if (net < 0 || net > order.total) {
    throw new PaymentError("Perhitungan pembayaran tidak valid.");
  }

  const refunds = await tx.payment.count({
    where: { orderId, status: "VERIFIED", kind: "REFUND" },
  });

  const next: PaymentStatusValue =
    net >= order.total
      ? "PAID"
      : net > 0
        ? "DP_PARTIAL"
        : refunds > 0
          ? "REFUNDED"
          : order.status === "CANCELLED"
            ? "PAYMENT_CANCELLED"
            : "UNPAID";

  await tx.order.update({
    where: { id: orderId },
    data: { paidAmount: net, paymentStatus: next },
  });

  if (next !== order.paymentStatus) {
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        kind: "PAYMENT",
        fromValue: order.paymentStatus,
        toValue: next,
        changedById: adminId,
        visibleToCustomer: true,
      },
    });
  }
}

function parsePaidAt(paidAt: string): Date {
  if (paidAt > todayWib()) {
    throw new PaymentError("Tanggal pembayaran tidak boleh di masa depan.");
  }
  const date = new Date(`${paidAt}T00:00:00+07:00`);
  if (Number.isNaN(date.getTime())) {
    throw new PaymentError("Tanggal pembayaran tidak valid.");
  }
  return date;
}

type RecordInput = {
  orderId: string;
  adminId: string;
  amount: number;
  method: Method;
  methodLabel: string;
  paidAt: string;
  note: string;
};

export async function recordPaymentService(
  input: RecordInput & { verifyNow: boolean }
): Promise<{ orderNumber: string }> {
  const { orderId, adminId, amount, method, methodLabel, note, verifyNow } = input;
  const paidAt = parsePaidAt(input.paidAt);

  return prisma.$transaction(async (tx) => {
    await lockOrder(tx, orderId);
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      select: { orderNumber: true, status: true, total: true },
    });

    if (order.status === "CANCELLED") {
      throw new PaymentError("Pesanan dibatalkan, pembayaran baru tidak bisa dicatat.");
    }

    const net = await verifiedNet(tx, orderId);
    const remaining = order.total - net;
    if (remaining <= 0) throw new PaymentError("Pesanan ini sudah lunas.");
    if (amount > remaining) {
      throw new PaymentError(
        `Nominal melebihi sisa tagihan (${formatRupiah(remaining)}). Catat sebesar sisa tagihan saja dan tangani kelebihannya di luar sistem.`
      );
    }

    const kind = net + amount >= order.total ? "FULL" : net === 0 ? "DP" : "INSTALLMENT";
    const now = new Date();

    const payment = await tx.payment.create({
      data: {
        orderId,
        kind,
        amount,
        method,
        methodLabel: method === "OTHER" ? methodLabel : null,
        status: verifyNow ? "VERIFIED" : "PENDING_VERIFICATION",
        paidAt,
        verifiedAt: verifyNow ? now : null,
        verifiedById: verifyNow ? adminId : null,
        createdById: adminId,
        note: note || null,
      },
      select: { id: true },
    });

    if (verifyNow) await syncOrderPayment(tx, orderId, adminId);

    await logActivity(tx, {
      adminId,
      action: verifyNow ? "payment.record_verified" : "payment.record_pending",
      entityType: "Payment",
      entityId: payment.id,
      metadata: { orderNumber: order.orderNumber, amount, kind },
    });

    return { orderNumber: order.orderNumber };
  });
}

export async function recordRefundService(
  input: RecordInput
): Promise<{ orderNumber: string }> {
  const { orderId, adminId, amount, method, methodLabel, note } = input;
  const paidAt = parsePaidAt(input.paidAt);

  return prisma.$transaction(async (tx) => {
    await lockOrder(tx, orderId);
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      select: { orderNumber: true },
    });

    const net = await verifiedNet(tx, orderId);
    if (net <= 0) throw new PaymentError("Belum ada pembayaran terverifikasi yang bisa dikembalikan.");
    if (amount > net) {
      throw new PaymentError(
        `Pengembalian melebihi pembayaran terverifikasi (${formatRupiah(net)}).`
      );
    }

    const refund = await tx.payment.create({
      data: {
        orderId,
        kind: "REFUND",
        amount,
        method,
        methodLabel: method === "OTHER" ? methodLabel : null,
        status: "VERIFIED",
        paidAt,
        verifiedAt: new Date(),
        verifiedById: adminId,
        createdById: adminId,
        note: note || null,
      },
      select: { id: true },
    });

    await syncOrderPayment(tx, orderId, adminId);

    await logActivity(tx, {
      adminId,
      action: "payment.refund",
      entityType: "Payment",
      entityId: refund.id,
      metadata: { orderNumber: order.orderNumber, amount },
    });

    return { orderNumber: order.orderNumber };
  });
}

export async function verifyPaymentService(input: {
  paymentId: string;
  adminId: string;
  decision: "verify" | "reject";
  note: string;
}): Promise<{ orderId: string }> {
  const { paymentId, adminId, decision, note } = input;

  return prisma.$transaction(async (tx) => {
    const found = await tx.payment.findUnique({
      where: { id: paymentId },
      select: { orderId: true },
    });
    if (!found) throw new PaymentError("Pembayaran tidak ditemukan.");

    await lockOrder(tx, found.orderId);

    const payment = await tx.payment.findUniqueOrThrow({
      where: { id: paymentId },
      select: { amount: true, status: true, note: true },
    });
    if (payment.status !== "PENDING_VERIFICATION") {
      throw new PaymentError("Pembayaran ini sudah diproses.");
    }

    const order = await tx.order.findUniqueOrThrow({
      where: { id: found.orderId },
      select: { orderNumber: true, status: true, total: true },
    });

    const mergedNote = [payment.note, note].filter(Boolean).join(" | ") || null;
    const now = new Date();

    if (decision === "reject") {
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: "REJECTED", verifiedAt: now, verifiedById: adminId, note: mergedNote },
      });
    } else {
      if (order.status === "CANCELLED") {
        throw new PaymentError("Pesanan dibatalkan. Tolak pembayaran ini, jangan diverifikasi.");
      }
      const net = await verifiedNet(tx, found.orderId);
      if (net + payment.amount > order.total) {
        throw new PaymentError("Memverifikasi pembayaran ini akan melebihi total pesanan.");
      }
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: "VERIFIED", verifiedAt: now, verifiedById: adminId, note: mergedNote },
      });
      await syncOrderPayment(tx, found.orderId, adminId);
    }

    await logActivity(tx, {
      adminId,
      action: decision === "verify" ? "payment.verify" : "payment.reject",
      entityType: "Payment",
      entityId: paymentId,
      metadata: { orderNumber: order.orderNumber, amount: payment.amount },
    });

    return { orderId: found.orderId };
  });
}