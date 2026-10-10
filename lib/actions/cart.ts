"use server";

import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { MAX_LINES } from "@/lib/cart/constants";
import { isPublicProduct } from "@/lib/product-utils";
import type { CartLineDetail } from "@/lib/cart/types";

const idsSchema = z.array(z.string().min(1).max(40)).max(MAX_LINES);

export async function getCartDetails(
  variantIds: string[]
): Promise<CartLineDetail[]> {
  const parsed = idsSchema.safeParse(variantIds);
  if (!parsed.success || parsed.data.length === 0) return [];

  const ids = [...new Set(parsed.data)];

  const rows = await prisma.productVariant.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      size: true,
      stock: true,
      isAvailable: true,
      product: {
        select: {
          slug: true,
          name: true,
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
          variants: {
            where: { isAvailable: true },
            select: { id: true, size: true, stock: true },
          },
        },
      },
    },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));

  return ids.map((id): CartLineDetail => {
    const v = byId.get(id);

    if (!v || !v.isAvailable || !isPublicProduct(v.product)) {
      return {
        variantId: id,
        status: "unavailable",
        productSlug: "",
        productName: "",
        brandName: "",
        imageUrl: null,
        size: "",
        unitPrice: 0,
        stock: 0,
        sizes: [],
      };
    }

    return {
      variantId: v.id,
      status: "ok",
      productSlug: v.product.slug,
      productName: v.product.name,
      brandName: v.product.brand.name,
      imageUrl: v.product.images[0]?.url ?? null,
      size: v.size,
      unitPrice: v.product.discountPrice ?? v.product.price,
      stock: v.stock,
      sizes: [...v.product.variants]
        .sort((a, b) => a.size.localeCompare(b.size, undefined, { numeric: true }))
        .map((s) => ({ variantId: s.id, size: s.size, stock: s.stock })),
    };
  });
}