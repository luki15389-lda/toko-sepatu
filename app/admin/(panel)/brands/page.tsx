import type { Metadata } from "next";
import { TaxonomyManager } from "@/components/admin/taxonomy-manager";
import {
  deleteBrand,
  saveBrand,
  setBrandActive,
} from "@/lib/actions/admin/brands";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = { title: "Merek" };

export default async function AdminBrandsPage() {
  await requireAdmin();

  const rows = await prisma.brand.findMany({
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
      title="Merek"
      noun="merek"
      description="Kelola merek sepatu yang Anda jual."
      items={rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        isActive: r.isActive,
        productCount: r._count.products,
      }))}
      actions={{
        save: saveBrand,
        remove: deleteBrand,
        toggle: setBrandActive,
      }}
    />
  );
}