import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

/** Syarat sebuah produk boleh tampil di website publik. */
export const publicProductWhere = {
  isPublished: true,
  archivedAt: null,
  brand: { isActive: true },
  category: { isActive: true },
} satisfies Prisma.ProductWhereInput;

export const cardSelect = {
  id: true,
  slug: true,
  name: true,
  price: true,
  discountPrice: true,
  createdAt: true,
  brand: { select: { name: true } },
  images: {
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
    take: 1,
    select: { url: true, alt: true },
  },
  variants: { select: { stock: true, isAvailable: true } },
} satisfies Prisma.ProductSelect;

export type CardRow = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  discountPrice: number | null;
  imageUrl: string | null;
  imageAlt: string | null;
  totalStock: number;
  isNew: boolean;
};

const NEW_PRODUCT_DAYS = 14;

export function toCard(row: CardRow): ProductCardData {
  const totalStock = row.variants
    .filter((v) => v.isAvailable)
    .reduce((sum, v) => sum + v.stock, 0);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand.name,
    price: row.price,
    discountPrice: row.discountPrice,
    imageUrl: row.images[0]?.url ?? null,
    imageAlt: row.images[0]?.alt ?? null,
    totalStock,
    isNew:
      Date.now() - row.createdAt.getTime() <
      NEW_PRODUCT_DAYS * 24 * 60 * 60 * 1000,
  };
}

export async function getFeaturedProducts(
  limit = 4
): Promise<ProductCardData[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const rows = await prisma.product.findMany({
    where: { ...publicProductWhere, isFeatured: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: cardSelect,
  });
  return rows.map(toCard);
}

export async function getLatestProducts(
  limit = 4
): Promise<ProductCardData[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const rows = await prisma.product.findMany({
    where: publicProductWhere,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: cardSelect,
  });
  return rows.map(toCard);
}

/**
 * Produk terlaris dihitung dari pesanan sungguhan (selain yang dibatalkan).
 * Jika belum ada pesanan, hasilnya kosong dan bagiannya tidak ditampilkan.
 */
export async function getBestSellingProducts(
  limit = 4
): Promise<ProductCardData[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products", "orders");

  const grouped = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      order: { status: { not: "CANCELLED" } },
      product: publicProductWhere,
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  if (grouped.length === 0) return [];

  const ids = grouped.map((g) => g.productId);
  const rows = await prisma.product.findMany({
    where: { id: { in: ids }, ...publicProductWhere },
    select: cardSelect,
  });

  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids
    .map((id) => byId.get(id))
    .filter((r): r is CardRow => r !== undefined)
    .map(toCard);
}

export type HomeCategory = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  productCount: number;
};

export async function getHomeCategories(): Promise<HomeCategory[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("categories", "products");

  const rows = await prisma.category.findMany({
    where: { isActive: true, products: { some: publicProductWhere } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
      _count: { select: { products: { where: publicProductWhere } } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    imageUrl: r.imageUrl,
    productCount: r._count.products,
  }));
}