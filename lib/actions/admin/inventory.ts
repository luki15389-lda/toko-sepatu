"use server";

import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireAdminAction } from "@/lib/auth/session";
import { logActivity } from "@/lib/admin/activity";
import {
  stockAdjustSchema,
  type StockAdjustInput,
} from "@/lib/validations/inventory";
import { fail, succeed, type ActionResult } from "@/lib/actions/admin/types";

export async function adjustStock(
  variantId: string,
  values: StockAdjustInput
): Promise<ActionResult> {
  const admin = await requireAdminAction();

  const parsed = stockAdjustSchema.safeParse(values);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }
  const { kind, quantity, note } = parsed.data;
  const delta = kind === "SUBTRACT" ? -quantity : quantity;

  const outcome = await prisma.$transaction(async (tx) => {
    // Atomik: stok tidak pernah menjadi negatif, dan aman walau ada pesanan bersamaan
    const rows = await tx.$queryRaw<{ stock: number }[]>`
      UPDATE "product_variants"
      SET "stock" = "stock" + ${delta}::int, "updatedAt" = now()
      WHERE "id" = ${variantId} AND "stock" + ${delta}::int >= 0
      RETURNING "stock"
    `;

    if (rows.length === 0) {
      const exists = await tx.productVariant.findUnique({
        where: { id: variantId },
        select: { stock: true },
      });
      return exists
        ? { ok: false as const, message: `Stok saat ini ${exists.stock}, tidak cukup untuk dikurangi ${quantity}.` }
        : { ok: false as const, message: "Ukuran tidak ditemukan." };
    }

    const after = rows[0].stock;
    await tx.inventoryMovement.create({
      data: {
        variantId,
        type: kind === "RESTOCK" ? "RESTOCK" : "ADJUSTMENT",
        quantityChange: delta,
        stockBefore: after - delta,
        stockAfter: after,
        note: note || (kind === "RESTOCK" ? "Barang masuk" : null),
        createdById: admin.id,
      },
    });
    await logActivity(tx, {
      adminId: admin.id,
      action: "stock.adjust",
      entityType: "ProductVariant",
      entityId: variantId,
      metadata: { kind, delta, after },
    });
    return { ok: true as const };
  });

  if (!outcome.ok) return fail(outcome.message);

  updateTag("products");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  return succeed("Stok diperbarui.");
}