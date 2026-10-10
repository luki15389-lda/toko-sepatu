import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { MAX_QTY_PER_LINE } from "@/lib/cart/constants";
import { isPublicProduct } from "@/lib/product-utils";
import {
  generateAccessToken,
  generateOrderNumber,
  hashAccessToken,
} from "@/lib/orders/access";

export type CreateOrderInput = {
  name: string;
  whatsapp: string;
  note: string | null;
  items: { variantId: string; quantity: number }[];
};

export type StockIssue = {
  productName: string;
  size: string;
  requested: number;
  available: number;
};

export type CreateOrderResult =
  | { ok: true; orderNumber: string; accessToken: string }
  | { ok: false; message: string; issues: StockIssue[] };

class OrderConflictError extends Error {
  issues: StockIssue[];
  constructor(issues: StockIssue[], message: string) {
    super(message);
    this.issues = issues;
  }
}

export async function countPendingOrders(whatsapp: string): Promise<number> {
  return prisma.order.count({
    where: { customerWhatsapp: whatsapp, status: "PENDING_CONFIRMATION" },
  });
}

export async function createOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  // Gabungkan baris duplikat varian yang sama
  const merged = new Map<string, number>();
  for (const it of input.items) {
    merged.set(it.variantId, (merged.get(it.variantId) ?? 0) + it.quantity);
  }
  for (const qty of merged.values()) {
    if (qty > MAX_QTY_PER_LINE) {
      return {
        ok: false,
        message: `Jumlah per produk maksimal ${MAX_QTY_PER_LINE}.`,
        issues: [],
      };
    }
  }

  // Urutan tetap mencegah deadlock saat banyak pesanan bersamaan
  const lines = [...merged.entries()]
    .map(([variantId, quantity]) => ({ variantId, quantity }))
    .sort((a, b) => (a.variantId < b.variantId ? -1 : 1));

  for (let attempt = 0; attempt < 3; attempt++) {
    const orderNumber = generateOrderNumber();
    const accessToken = generateAccessToken();

    try {
      await prisma.$transaction((tx) =>
        runCreate(tx, { input, lines, orderNumber, accessToken })
      );
      return { ok: true, orderNumber, accessToken };
    } catch (error) {
      if (error instanceof OrderConflictError) {
        return { ok: false, message: error.message, issues: error.issues };
      }
      // Nomor pesanan kebetulan bentrok: ulangi dengan nomor baru
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Gagal membuat nomor pesanan yang unik.");
}

async function runCreate(
  tx: Prisma.TransactionClient,
  ctx: {
    input: CreateOrderInput;
    lines: { variantId: string; quantity: number }[];
    orderNumber: string;
    accessToken: string;
  }
) {
  const { input, lines, orderNumber, accessToken } = ctx;

  // 1. Baca data terkini dari database
  const variants = await tx.productVariant.findMany({
    where: { id: { in: lines.map((l) => l.variantId) } },
    select: {
      id: true,
      size: true,
      sku: true,
      stock: true,
      isAvailable: true,
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
          discountPrice: true,
          isPublished: true,
          archivedAt: true,
          brand: { select: { name: true, isActive: true } },
          category: { select: { isActive: true } },
          images: {
            orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
            take: 1,
            select: { url: true },
          },
        },
      },
    },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));

  // 2. Periksa ketersediaan dan kumpulkan semua masalah sekaligus
  const issues: StockIssue[] = [];
  const items = lines.flatMap((line) => {
    const v = byId.get(line.variantId);

    if (!v || !v.isAvailable || !isPublicProduct(v.product)) {
      issues.push({
        productName: v?.product.name ?? "Produk tidak tersedia",
        size: v?.size ?? "-",
        requested: line.quantity,
        available: 0,
      });
      return [];
    }
    if (v.stock < line.quantity) {
      issues.push({
        productName: v.product.name,
        size: v.size,
        requested: line.quantity,
        available: v.stock,
      });
      return [];
    }

    // Harga dari database: harga diskon jika ada
    const unitPrice = v.product.discountPrice ?? v.product.price;
    return [
      {
        variantId: v.id,
        productId: v.product.id,
        productName: v.product.name,
        productSku: v.product.sku,
        brandName: v.product.brand.name,
        size: v.size,
        variantSku: v.sku,
        imageUrl: v.product.images[0]?.url ?? null,
        unitPrice,
        quantity: line.quantity,
        lineTotal: unitPrice * line.quantity,
        stockSeen: v.stock,
      },
    ];
  });

  if (issues.length > 0) {
    throw new OrderConflictError(
      issues,
      "Sebagian produk di keranjang tidak tersedia atau stoknya tidak mencukupi."
    );
  }

  // 3. Kurangi stok secara atomik (gagal jika stok sudah diambil pesanan lain)
  const stockAfter = new Map<string, number>();
  for (const it of items) {
    const rows = await tx.$queryRaw<{ stock: number }[]>`
      UPDATE "product_variants"
      SET "stock" = "stock" - ${it.quantity}::int, "updatedAt" = now()
      WHERE "id" = ${it.variantId}
        AND "stock" >= ${it.quantity}::int
        AND "isAvailable" = true
      RETURNING "stock"
    `;
    if (rows.length === 0) {
      throw new OrderConflictError(
        [
          {
            productName: it.productName,
            size: it.size,
            requested: it.quantity,
            available: 0,
          },
        ],
        "Stok baru saja berubah. Perbarui keranjang Anda lalu coba lagi."
      );
    }
    stockAfter.set(it.variantId, rows[0].stock);
  }

  // 4. Hitung nilai pesanan dari data database
  const subtotal = items.reduce((sum, it) => sum + it.lineTotal, 0);
  const setting = await tx.storeSetting.findUnique({
    where: { id: "main" },
    select: { dpPercentage: true },
  });
  const dpPercentage = setting?.dpPercentage ?? 50;
  const dpAmount = Math.round((subtotal * dpPercentage) / 100);

  // 5. Simpan pelanggan dan pesanan (harga disimpan sebagai snapshot)
  const customer = await tx.customer.upsert({
    where: { whatsapp: input.whatsapp },
    update: {},
    create: { name: input.name, whatsapp: input.whatsapp },
    select: { id: true },
  });

  const order = await tx.order.create({
    data: {
      orderNumber,
      customerId: customer.id,
      customerName: input.name,
      customerWhatsapp: input.whatsapp,
      note: input.note,
      subtotal,
      total: subtotal,
      dpPercentage,
      dpAmount,
      accessTokenHash: hashAccessToken(accessToken),
      items: {
        create: items.map((it) => ({
          productId: it.productId,
          variantId: it.variantId,
          productName: it.productName,
          productSku: it.productSku,
          brandName: it.brandName,
          size: it.size,
          variantSku: it.variantSku,
          imageUrl: it.imageUrl,
          unitPrice: it.unitPrice,
          quantity: it.quantity,
          lineTotal: it.lineTotal,
        })),
      },
    },
    select: {
      id: true,
      items: { select: { id: true, variantId: true, quantity: true } },
    },
  });

  // 6. Catat pergerakan stok (unik per item pesanan: tidak bisa tercatat ganda)
  await tx.inventoryMovement.createMany({
    data: order.items.map((oi): Prisma.InventoryMovementCreateManyInput => {
      const after = stockAfter.get(oi.variantId)!;
      return {
        variantId: oi.variantId,
        orderItemId: oi.id,
        type: "ORDER_RESERVED",
        quantityChange: -oi.quantity,
        stockBefore: after + oi.quantity,
        stockAfter: after,
        note: `Stok ditahan untuk pesanan ${orderNumber}`,
      };
    }),
  });

  // 7. Riwayat status pertama
  await tx.orderStatusHistory.create({
    data: {
      orderId: order.id,
      kind: "ORDER",
      fromValue: null,
      toValue: "PENDING_CONFIRMATION",
      note: "Pesanan dibuat oleh pelanggan.",
      visibleToCustomer: true,
    },
  });
}