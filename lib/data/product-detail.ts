import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import {
  cardSelect,
  publicProductWhere,
  toCard,
  type ProductCardData,
} from "@/lib/data/products";

export type ProductDetail = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  description: string;
  material: string | null;
  specifications: string | null;
  price: number;
  discountPrice: number | null;
  isNew: boolean;
  brand: { name: string; slug: string };
  category: { name: string; slug: string };
  images: { url: string; alt: string | null }[];
  variants: { id: string; size: string; stock: number; isAvailable: boolean }[];
};

export async function getProductBySlug(
  slug: string
): Promise<ProductDetail | null> {
  "use cache";
  cacheLife("seconds");
  cacheTag("products", `product:${slug}`);

  const p = await prisma.product.findFirst({
    where: { slug, ...publicProductWhere },
    select: {
      id: true,
      slug: true,
      name: true,
      sku: true,
      description: true,
      material: true,
      specifications: true,
      price: true,
      discountPrice: true,
      createdAt: true,
      brand: { select: { name: true, slug: true } },
      category: { select: { name: true, slug: true } },
      images: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        select: { url: true, alt: true },
      },
      variants: {
        select: { id: true, size: true, stock: true, isAvailable: true },
      },
    },
  });

  if (!p) return null;

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    sku: p.sku,
    description: p.description,
    material: p.material,
    specifications: p.specifications,
    price: p.price,
    discountPrice: p.discountPrice,
    isNew: Date.now() - p.createdAt.getTime() < 14 * 24 * 60 * 60 * 1000,
    brand: p.brand,
    category: p.category,
    images: p.images,
    variants: [...p.variants].sort((a, b) =>
      a.size.localeCompare(b.size, undefined, { numeric: true })
    ),
  };
}

export async function getRelatedProducts(
  categorySlug: string,
  excludeId: string,
  limit = 4
): Promise<ProductCardData[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");

  const rows = await prisma.product.findMany({
    where: {
      ...publicProductWhere,
      category: { slug: categorySlug, isActive: true },
      id: { not: excludeId },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: cardSelect,
  });

  return rows.map(toCard);
}