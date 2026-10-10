import type { Metadata } from "next";
import { TaxonomyManager } from "@/components/admin/taxonomy-manager";
import {
  deleteCategory,
  saveCategory,
  setCategoryActive,
} from "@/lib/actions/admin/categories";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = { title: "Kategori" };

export default async function AdminCategoriesPage() {
  await requireAdmin();

  const rows = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      isActive: true,
      _count: { select: { products: true } },
    },
  });

  return (
    <TaxonomyManager
      title="Kategori"
      noun="kategori"
      description="Kelompokkan produk agar mudah ditemukan pelanggan."
      items={rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        isActive: r.isActive,
        productCount: r._count.products,
      }))}
      actions={{
        save: saveCategory,
        remove: deleteCategory,
        toggle: setCategoryActive,
      }}
    />
  );
}