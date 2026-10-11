import "dotenv/config";
import { prisma } from "../lib/db/prisma";
import { createOrder } from "../lib/orders/create-order";
import { recordPaymentService } from "../lib/orders/payments";
import { todayWib } from "../lib/utils";

const SKU = "SLS-SCL-001-41";
const PHONE = "628990002222";

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
  if (!admin) throw new Error("Admin tidak ditemukan (jalankan seed dulu).");

  const variant = await prisma.productVariant.findUnique({
    where: { sku: SKU },
    select: { id: true, stock: true },
  });
  if (!variant || variant.stock < 1) throw new Error(`Stok ${SKU} kosong atau tidak ada.`);
  const stockBefore = variant.stock;

  let orderId: string | null = null;
  let passed = false;

  try {
    const created = await createOrder({
      name: "Tes Bayar",
      whatsapp: PHONE,
      note: null,
      items: [{ variantId: variant.id, quantity: 1 }],
    });
    if (!created.ok) throw new Error(created.message);

    const order = await prisma.order.findUniqueOrThrow({
      where: { orderNumber: created.orderNumber },
      select: { id: true, total: true },
    });
    orderId = order.id;

    const part = Math.ceil(order.total * 0.6);
    const base = {
      orderId: order.id,
      adminId: admin.id,
      method: "BANK_TRANSFER" as const,
      methodLabel: "",
      paidAt: todayWib(),
      note: "tes",
      verifyNow: true,
    };

    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () => recordPaymentService({ ...base, amount: part }))
    );
    const okCount = results.filter((r) => r.status === "fulfilled").length;

    const mid = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      select: { paidAmount: true, paymentStatus: true },
    });

    await recordPaymentService({ ...base, amount: order.total - mid.paidAmount });
    const done = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      select: { paidAmount: true, paymentStatus: true },
    });

    console.log(`Total pesanan             : ${order.total}`);
    console.log(`Pembayaran serentak       : 5 x ${part}`);
    console.log(`Yang berhasil             : ${okCount} (harus 1)`);
    console.log(`Terbayar setelah itu      : ${mid.paidAmount} / ${mid.paymentStatus} (harus ${part} / DP_PARTIAL)`);
    console.log(`Setelah pelunasan         : ${done.paidAmount} / ${done.paymentStatus} (harus ${order.total} / PAID)`);

    passed =
      okCount === 1 &&
      mid.paidAmount === part &&
      mid.paymentStatus === "DP_PARTIAL" &&
      done.paidAmount === order.total &&
      done.paymentStatus === "PAID";
  } finally {
    if (orderId) {
      await prisma.$transaction([
        prisma.payment.deleteMany({ where: { orderId } }),
        prisma.inventoryMovement.deleteMany({ where: { orderItem: { orderId } } }),
        prisma.orderStatusHistory.deleteMany({ where: { orderId } }),
        prisma.orderItem.deleteMany({ where: { orderId } }),
        prisma.order.deleteMany({ where: { id: orderId } }),
        prisma.activityLog.deleteMany({ where: { entityType: "Payment", createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } } }),
      ]);
    }
    await prisma.customer.deleteMany({ where: { whatsapp: PHONE } });
    await prisma.productVariant.update({ where: { id: variant.id }, data: { stock: stockBefore } });
    console.log("Data tes dibersihkan, stok dikembalikan ke", stockBefore);
  }

  console.log(passed ? "✅ LULUS: pembayaran tidak bisa melebihi total" : "❌ GAGAL");
  process.exitCode = passed ? 0 : 1;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());