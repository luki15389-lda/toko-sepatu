import type { Metadata } from "next";
import Link from "next/link";
import { Plus, SearchX } from "lucide-react";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import { SafeImage } from "@/components/shared/safe-image";
import {
  ADMIN_PAGE_SIZE,
  SORT_OPTIONS,
  STATUS_OPTIONS,
  adminProductQuery,
  parseAdminProductFilters,
  type AdminProductFilters,
} from "@/lib/admin/product-list";
import { requireAdmin } from "@/lib/auth/session";
import type { RawSearchParams } from "@/lib/catalog";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { cn, formatRupiah } from "@/lib/utils";

export const metadata: Metadata = { title: "Produk" };

function buildWhere(f: AdminProductFilters): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [];

  if (f.status === "archived") {
    and.push({ archivedAt: { not: null } });
  } else {
    and.push({ archivedAt: null });
    if (f.status === "published") and.push({ isPublished: true });
    if (f.status === "draft") and.push({ isPublished: false });
  }

  if (f.q) {
    and.push({
      OR: [
        { name: { contains: f.q, mode: "insensitive" } },
        { sku: { contains: f.q, mode: "insensitive" } },
        { brand: { name: { contains: f.q, mode: "insensitive" } } },
      ],
    });
  }
  if (f.categoryId) and.push({ categoryId: f.categoryId });
  if (f.brandId) and.push({ brandId: f.brandId });

  return { AND: and };
}

function buildOrderBy(sort: AdminProductFilters["sort"]): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "name_asc":
      return { name: "asc" };
    case "price_asc":
      return { price: "asc" };
    case "price_desc":
      return { price: "desc" };
    default:
      return { createdAt: "desc" };
  }
}

const selectClass =
  "h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none focus:border-ink";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  await requireAdmin();
  const filters = parseAdminProductFilters(await searchParams);
  const where = buildWhere(filters);

  const total = await prisma.product.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);

  const [rows, categories, brands, setting] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: buildOrderBy(filters.sort),
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        discountPrice: true,
        isPublished: true,
        isFeatured: true,
        archivedAt: true,
        brand: { select: { name: true } },
        category: { select: { name: true } },
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          take: 1,
          select: { url: true },
        },
        variants: { select: { stock: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.storeSetting.findUnique({
      where: { id: "main" },
      select: { lowStockThreshold: true },
    }),
  ]);

  const lowThreshold = setting?.lowStockThreshold ?? 5;
  const pageHref = (p: number) => `/admin/products${adminProductQuery(filters, { page: p })}`;
  const hasFilter =
    filters.q || filters.categoryId || filters.brandId || filters.status !== "active";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">Produk</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {total} produk{hasFilter ? " sesuai filter" : ""}.
          </p>
        </div>
        <Link
          href="/admin/products/create"
          className="flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-paper hover:bg-neutral-800"
        >
          <Plus className="size-4" aria-hidden />
          Tambah produk
        </Link>
      </div>

      <form
        action="/admin/products"
        method="get"
        role="search"
        aria-label="Filter produk"
        className="grid gap-3 rounded-2xl border border-stone-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto]"
      >
        <div>
          <label htmlFor="f-q" className="sr-only">Cari produk</label>
          <input
            id="f-q"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="Cari nama, SKU, atau merek"
            className={selectClass}
          />
        </div>
        <div>
          <label htmlFor="f-category" className="sr-only">Kategori</label>
          <select id="f-category" name="category" defaultValue={filters.categoryId ?? ""} className={selectClass}>
            <option value="">Semua kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-brand" className="sr-only">Merek</label>
          <select id="f-brand" name="brand" defaultValue={filters.brandId ?? ""} className={selectClass}>
            <option value="">Semua merek</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-status" className="sr-only">Status</label>
          <select id="f-status" name="status" defaultValue={filters.status} className={selectClass}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-sort" className="sr-only">Urutkan</label>
          <select id="f-sort" name="sort" defaultValue={filters.sort} className={selectClass}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="h-10 rounded-full bg-ink px-5 text-sm font-semibold text-paper hover:bg-neutral-800">
            Terapkan
          </button>
          <Link href="/admin/products" className="flex h-10 items-center rounded-full border border-stone-300 px-4 text-sm font-semibold hover:border-ink">
            Reset
          </Link>
        </div>
      </form>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
          <SearchX className="size-10 text-neutral-400" aria-hidden />
          <h2 className="mt-4 text-lg font-bold">Produk tidak ditemukan</h2>
          <p className="mt-1 text-sm text-neutral-600">
            {hasFilter
              ? "Coba ubah atau hapus sebagian filter."
              : "Belum ada produk. Klik Tambah produk untuk membuat yang pertama."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-line bg-white">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-stone-line bg-mist text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Produk</th>
                <th scope="col" className="px-5 py-3 font-semibold">Kategori / Merek</th>
                <th scope="col" className="px-5 py-3 font-semibold">Harga</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Stok</th>
                <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-line">
              {rows.map((p) => {
                const stock = p.variants.reduce((sum, v) => sum + v.stock, 0);
                const status = p.archivedAt
                  ? { label: "Diarsipkan", cls: "bg-stone-100 text-stone-600" }
                  : p.isPublished
                    ? { label: "Terbit", cls: "bg-emerald-50 text-emerald-700" }
                    : { label: "Draf", cls: "bg-amber-50 text-amber-700" };

                return (
                  <tr key={p.id}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-mist">
                          <SafeImage
                            src={p.images[0]?.url}
                            alt=""
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            className="line-clamp-1 font-semibold hover:underline"
                          >
                            {p.name}
                          </Link>
                          <p className="text-xs text-neutral-500">
                            {p.sku}
                            {p.isFeatured && " · Unggulan"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-neutral-700">
                      <p>{p.category.name}</p>
                      <p className="text-xs text-neutral-500">{p.brand.name}</p>
                    </td>
                    <td className="px-5 py-4">
                      {p.discountPrice ? (
                        <>
                          <p className="font-semibold">{formatRupiah(p.discountPrice)}</p>
                          <p className="text-xs text-neutral-400 line-through">
                            {formatRupiah(p.price)}
                          </p>
                        </>
                      ) : (
                        <p className="font-semibold">{formatRupiah(p.price)}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums">
                      <p className="font-semibold">{stock}</p>
                      {stock === 0 ? (
                        <p className="text-xs font-semibold text-red-600">Habis</p>
                      ) : stock <= lowThreshold ? (
                        <p className="text-xs font-semibold text-amber-700">Rendah</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", status.cls)}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <ProductRowActions id={p.id} name={p.name} archived={Boolean(p.archivedAt)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <nav aria-label="Halaman" className="flex items-center justify-between">
          <p className="text-sm text-neutral-600">
            Halaman {page} dari {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link href={pageHref(page - 1)} className="h-10 rounded-full border border-stone-300 px-5 text-sm font-semibold leading-10 hover:border-ink">
                Sebelumnya
              </Link>
            ) : (
              <span className="h-10 rounded-full border border-stone-200 px-5 text-sm font-semibold leading-10 text-stone-300">
                Sebelumnya
              </span>
            )}
            {page < totalPages ? (
              <Link href={pageHref(page + 1)} className="h-10 rounded-full border border-stone-300 px-5 text-sm font-semibold leading-10 hover:border-ink">
                Berikutnya
              </Link>
            ) : (
              <span className="h-10 rounded-full border border-stone-200 px-5 text-sm font-semibold leading-10 text-stone-300">
                Berikutnya
              </span>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}