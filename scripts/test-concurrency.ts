import "dotenv/config";
import { prisma } from "../lib/db/prisma";
import { createOrder } from "../lib/orders/create-order";

const SKU = "SLS-SCL-001-39";
const STOCK = 3;
const ATTEMPTS = 8;
const phones = Array.from(
  { length: ATTEMPTS },
  (_, i) => `628990000${String(i).padStart(4, "0")}`
);

async function main() {
  const variant = await prisma.productVariant.findUnique({
    where: { sku: SKU },
    select: { id: true, stock: true },
  });
  if (!variant) throw new Error(`Varian ${SKU} tidak ditemukan (jalankan seed dulu).`);

  const originalStock = variant.stock;
  await prisma.productVariant.update({
    where: { id: variant.id },
    data: { stock: STOCK },
  });

  let passed = false;
  try {
    const results = await Promise.all(
      phones.map((whatsapp, i) =>
        createOrder({
          name: `Tes Konkurensi ${i + 1}`,
          whatsapp,
          note: null,
          items: [{ variantId: variant.id, quantity: 1 }],
        })
      )
    );

    const okCount = results.filter((r) => r.ok).length;
    const after = await prisma.productVariant.findUniqueOrThrow({
      where: { id: variant.id },
      select: { stock: true },
    });
    const movements = await prisma.inventoryMovement.count({
      where: {
        variantId: variant.id,
        type: "ORDER_RESERVED",
        orderItem: { order: { customerWhatsapp: { in: phones } } },
      },
    });

    console.log(`Stok awal tes     : ${STOCK}`);
    console.log(`Pesanan serentak  : ${ATTEMPTS}`);
    console.log(`Pesanan berhasil  : ${okCount} (harus ${STOCK})`);
    console.log(`Stok akhir        : ${after.stock} (harus 0)`);
    console.log(`Catatan stok      : ${movements} (harus ${STOCK})`);

    passed = okCount === STOCK && after.stock === 0 && movements === STOCK;
  } finally {
    const orders = await prisma.order.findMany({
      where: { customerWhatsapp: { in: phones } },
      select: { id: true },
    });
    const ids = orders.map((o) => o.id);

    await prisma.$transaction([
      prisma.inventoryMovement.deleteMany({
        where: { orderItem: { orderId: { in: ids } } },
      }),
      prisma.orderStatusHistory.deleteMany({ where: { orderId: { in: ids } } }),
      prisma.orderItem.deleteMany({ where: { orderId: { in: ids } } }),
      prisma.order.deleteMany({ where: { id: { in: ids } } }),
      prisma.customer.deleteMany({ where: { whatsapp: { in: phones } } }),
      prisma.productVariant.update({
        where: { id: variant.id },
        data: { stock: originalStock },
      }),
    ]);
    console.log("Data tes dibersihkan, stok dikembalikan ke", originalStock);
  }

  console.log(passed ? "✅ LULUS: tidak ada stok terjual berlebih" : "❌ GAGAL");
  process.exitCode = passed ? 0 : 1;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());