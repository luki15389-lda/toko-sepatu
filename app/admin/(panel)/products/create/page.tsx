import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import type { ProductFormValues } from "@/lib/validations/product";

export const metadata: Metadata = { title: "Tambah Produk" };

const EMPTY: ProductFormValues = {
  name: "",
  slug: "",
  sku: "",
  brandId: "",
  categoryId: "",
  description: "",
  material: "",
  specifications: "",
  price: 0,
  discountPrice: null,
  isPublished: false,
  isFeatured: false,
  images: [],
  variants: [],
};

export default async function CreateProductPage() {
  await requireAdmin();

  const [brands, categories] = await Promise.all([
    prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb
          items={[
            { label: "Produk", href: "/admin/products" },
            { label: "Tambah produk" },
          ]}
        />
        <h1 className="mt-3 text-2xl font-extrabold">Tambah produk</h1>
      </div>

      {brands.length === 0 || categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-sm">
          Anda perlu memiliki minimal satu{" "}
          <Link href="/admin/brands" className="font-semibold underline">merek</Link> dan satu{" "}
          <Link href="/admin/categories" className="font-semibold underline">kategori</Link>{" "}
          aktif sebelum menambah produk.
        </div>
      ) : (
        <ProductForm
          productId={null}
          defaultValues={EMPTY}
          brands={brands}
          categories={categories}
          lockedVariantIds={[]}
        />
      )}
    </div>
  );
}