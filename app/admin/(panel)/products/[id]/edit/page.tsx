import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = { title: "Edit Produk" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
      variants: {
        orderBy: { createdAt: "asc" },
        include: { _count: { select: { orderItems: true } } },
      },
    },
  });
  if (!product) notFound();

  const [brands, categories] = await Promise.all([
    prisma.brand.findMany({
      where: { OR: [{ isActive: true }, { id: product.brandId }] },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.category.findMany({
      where: { OR: [{ isActive: true }, { id: product.categoryId }] },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const variants = [...product.variants].sort((a, b) =>
    a.size.localeCompare(b.size, undefined, { numeric: true })
  );

  const isLive = product.isPublished && !product.archivedAt;

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb
          items={[
            { label: "Produk", href: "/admin/products" },
            { label: product.name },
          ]}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold">Edit produk</h1>
          {isLive && (
            <Link
              href={`/products/${product.slug}`}
              target="_blank"
              className="text-sm font-semibold underline underline-offset-4"
            >
              Lihat di toko
            </Link>
          )}
        </div>
        {product.archivedAt && (
          <p className="mt-2 rounded-lg bg-stone-100 px-4 py-2.5 text-sm text-stone-700">
            Produk ini diarsipkan dan tidak tampil di toko. Pulihkan dari daftar produk.
          </p>
        )}
      </div>

      <ProductForm
        productId={product.id}
        defaultValues={{
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          brandId: product.brandId,
          categoryId: product.categoryId,
          description: product.description,
          material: product.material ?? "",
          specifications: product.specifications ?? "",
          price: product.price,
          discountPrice: product.discountPrice,
          isPublished: product.isPublished,
          isFeatured: product.isFeatured,
          images: product.images.map((i) => ({ url: i.url, alt: i.alt ?? "" })),
          variants: variants.map((v) => ({
            variantId: v.id,
            size: v.size,
            sku: v.sku,
            stock: v.stock,
            isAvailable: v.isAvailable,
          })),
        }}
        brands={brands}
        categories={categories}
        lockedVariantIds={variants
          .filter((v) => v._count.orderItems > 0)
          .map((v) => v.id)}
      />
    </div>
  );
}