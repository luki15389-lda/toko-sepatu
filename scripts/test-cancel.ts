import "dotenv/config";
import { prisma } from "../lib/db/prisma";
import { createOrder } from "../lib/orders/create-order";
import { cancelOrderService } from "../lib/orders/transitions";

const SKU = "SLS-SCL-001-40";
const PHONE = "628990001111";

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  if (!admin) throw new Error("Admin tidak ditemukan (jalankan seed dulu).");

  const variant = await prisma.productVariant.findUnique({
    where: { sku: SKU },
    select: { id: true, stock: true },
  });
  if (!variant) throw new Error(`Varian ${SKU} tidak ditemukan.`);
  if (variant.stock < 2) throw new Error(`Stok ${SKU} kurang dari 2, tambah dulu.`);

  const stockNow = async () =>
    (
      await prisma.productVariant.findUniqueOrThrow({
        where: { id: variant.id },
        select: { stock: true },
      })
    ).stock;

  const stockBefore = variant.stock;
  let orderId: string | null = null;
  let passed = false;

  try {
    const created = await createOrder({
      name: "Tes Batal",
      whatsapp: PHONE,
      note: null,
      items: [{ variantId: variant.id, quantity: 2 }],
    });
    if (!created.ok) throw new Error(created.message);

    const order = await prisma.order.findUniqueOrThrow({
      where: { orderNumber: created.orderNumber },
      select: { id: true },
    });
    orderId = order.id;

    const afterCreate = await stockNow();

    const results = await Promise.allSettled(
      Array.from({ length: 6 }, () =>
        cancelOrderService({
          orderId: order.id,
          adminId: admin.id,
          reason: "Tes pembatalan serentak",
        })
      )
    );
    const okCount = results.filter((r) => r.status === "fulfilled").length;

    const afterCancel = await stockNow();
    const released = await prisma.inventoryMovement.count({
      where: { type: "ORDER_RELEASED", orderItem: { orderId: order.id } },
    });
    const final = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      select: { status: true, paymentStatus: true, fulfillmentStatus: true },
    });

    console.log(`Stok sebelum pesan      : ${stockBefore}`);
    console.log(`Stok setelah dipesan    : ${afterCreate} (harus ${stockBefore - 2})`);
    console.log(`Pembatalan serentak     : 6`);
    console.log(`Pembatalan yang berhasil: ${okCount} (harus 1)`);
    console.log(`Stok setelah batal      : ${afterCancel} (harus ${stockBefore})`);
    console.log(`Catatan pengembalian    : ${released} (harus 1)`);
    console.log(`Status akhir            : ${final.status} / ${final.paymentStatus} / ${final.fulfillmentStatus}`);

    passed =
      okCount === 1 &&
      afterCreate === stockBefore - 2 &&
      afterCancel === stockBefore &&
      released === 1 &&
      final.status === "CANCELLED";
  } finally {
    if (orderId) {
      await prisma.$transaction([
        prisma.inventoryMovement.deleteMany({ where: { orderItem: { orderId } } }),
        prisma.orderStatusHistory.deleteMany({ where: { orderId } }),
        prisma.orderItem.deleteMany({ where: { orderId } }),
        prisma.order.deleteMany({ where: { id: orderId } }),
        prisma.activityLog.deleteMany({ where: { entityId: orderId } }),
      ]);
    }
    await prisma.customer.deleteMany({ where: { whatsapp: PHONE } });
    await prisma.productVariant.update({
      where: { id: variant.id },
      data: { stock: stockBefore },
    });
    console.log("Data tes dibersihkan, stok dikembalikan ke", stockBefore);
  }

  console.log(passed ? "✅ LULUS: stok dikembalikan tepat satu kali" : "❌ GAGAL");
  process.exitCode = passed ? 0 : 1;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());