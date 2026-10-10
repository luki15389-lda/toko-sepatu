import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { PAGE_SIZE, type CatalogFilters } from "@/lib/catalog";
import {
  cardSelect,
  publicProductWhere,
  toCard,
  type CardRow,
  type ProductCardData,
} from "@/lib/data/products";

export type CatalogPage = {
  products: ProductCardData[];
  total: number;
  page: number;
  totalPages: number;
};

export async function getCatalogPage(
  filters: CatalogFilters
): Promise<CatalogPage> {
  const and: Prisma.ProductWhereInput[] = [publicProductWhere];

  if (filters.q) {
    and.push({
      OR: [
        { name: { contains: filters.q, mode: "insensitive" } },
        { brand: { name: { contains: filters.q, mode: "insensitive" } } },
        { sku: { contains: filters.q, mode: "insensitive" } },
      ],
    });
  }
  if (filters.category) {
    and.push({ category: { slug: filters.category } });
  }
  if (filters.brands.length > 0) {
    and.push({ brand: { slug: { in: filters.brands } } });
  }
  if (filters.sizes.length > 0) {
    // Hanya produk yang ukuran tersebut MASIH ada stoknya
    and.push({
      variants: {
        some: {
          size: { in: filters.sizes },
          isAvailable: true,
          stock: { gt: 0 },
        },
      },
    });
  }
  if (filters.min !== null || filters.max !== null) {
    const range = {
      ...(filters.min !== null ? { gte: filters.min } : {}),
      ...(filters.max !== null ? { lte: filters.max } : {}),
    };
    // Harga akhir = harga diskon jika ada, kalau tidak harga normal
    and.push({
      OR: [
        { discountPrice: { not: null, ...range } },
        { discountPrice: null, price: range },
      ],
    });
  }

  const rows = await prisma.product.findMany({
    where: { AND: and },
    select: { id: true, price: true, discountPrice: true, createdAt: true },
  });

  const effective = (r: { price: number; discountPrice: number | null }) =>
    r.discountPrice ?? r.price;

  rows.sort((a, b) => {
    if (filters.sort === "price_asc") {
      return (
        effective(a) - effective(b) ||
        b.createdAt.getTime() - a.createdAt.getTime()
      );
    }
    if (filters.sort === "price_desc") {
      return (
        effective(b) - effective(a) ||
        b.createdAt.getTime() - a.createdAt.getTime()
      );
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);

  const pageIds = rows
    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    .map((r) => r.id);

  if (pageIds.length === 0) {
    return { products: [], total, page, totalPages };
  }

  const cards = await prisma.product.findMany({
    where: { id: { in: pageIds } },
    select: cardSelect,
  });
  const byId = new Map(cards.map((c) => [c.id, c]));

  const products = pageIds
    .map((id) => byId.get(id))
    .filter((c): c is CardRow => c !== undefined)
    .map(toCard);

  return { products, total, page, totalPages };
}

export type FilterOption = { slug: string; name: string; count: number };

export type CatalogFilterOptions = {
  categories: FilterOption[];
  brands: FilterOption[];
  sizes: string[];
};

export async function getCatalogFilterOptions(): Promise<CatalogFilterOptions> {
  "use cache";
  cacheLife("minutes");
  cacheTag("products", "categories", "brands");

  const [categories, brands, sizeRows] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true, products: { some: publicProductWhere } },
      orderBy: { name: "asc" },
      select: {
        slug: true,
        name: true,
        _count: { select: { products: { where: publicProductWhere } } },
      },
    }),
    prisma.brand.findMany({
      where: { isActive: true, products: { some: publicProductWhere } },
      orderBy: { name: "asc" },
      select: {
        slug: true,
        name: true,
        _count: { select: { products: { where: publicProductWhere } } },
      },
    }),
    prisma.productVariant.findMany({
      where: { isAvailable: true, product: publicProductWhere },
      select: { size: true },
      distinct: ["size"],
    }),
  ]);

  return {
    categories: categories.map((c) => ({
      slug: c.slug,
      name: c.name,
      count: c._count.products,
    })),
    brands: brands.map((b) => ({
      slug: b.slug,
      name: b.name,
      count: b._count.products,
    })),
    sizes: sizeRows
      .map((r) => r.size)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
  };
}

export async function getCategoryBySlug(slug: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("categories");

  return prisma.category.findFirst({
    where: { slug, isActive: true },
    select: { name: true, slug: true, description: true },
  });
}