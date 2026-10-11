import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { Pager } from "@/components/admin/pager";
import { StockAdjustButton } from "@/components/admin/stock-adjust-button";
import { requireAdmin } from "@/lib/auth/session";
import type { RawSearchParams } from "@/lib/catalog";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { cn, formatTanggalWaktu } from "@/lib/utils";

export const metadata: Metadata = { title: "Stok" };

const PAGE_SIZE = 25;
const LEVELS = ["all", "low", "out"] as const;

const MOVEMENT_LABEL: Record<string, string> = {
  INITIAL: "Stok awal",
  RESTOCK: "Barang masuk",
  ADJUSTMENT: "Penyesuaian",
  ORDER_RESERVED: "Ditahan pesanan",
  ORDER_RELEASED: "Dikembalikan (batal)",
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const fieldClass =
  "h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none focus:border-ink";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  await requireAdmin();
  const raw = await searchParams;

  const view = first(raw.view) === "history" ? "history" : "stock";
  const q = (first(raw.q) ?? "").trim().slice(0, 100);
  const level = LEVELS.find((l) => l === first(raw.level)) ?? "all";
  const variantFilter = first(raw.variant);
  const pageRaw = first(raw.page);
  const pageWanted = pageRaw && /^\d{1,4}$/.test(pageRaw) ? Math.max(1, Number(pageRaw)) : 1;

  const setting = await prisma.storeSetting.findUnique({
    where: { id: "main" },
    select: { lowStockThreshold: true },
  });
  const threshold = setting?.lowStockThreshold ?? 5;

  const tab = (v: "stock" | "history") =>
    cn(
      "rounded-full border px-5 py-2 text-sm font-semibold",
      view === v ? "border-ink bg-ink text-paper" : "border-stone-300 hover:border-ink"
    );

  const header = (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Stok</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Stok dikurangi saat pesanan dibuat dan dikembalikan sekali jika pesanan dibatalkan.
        </p>
      </div>
      <div className="flex gap-2">
        <Link href="/admin/inventory" className={tab("stock")}>Stok</Link>
        <Link href="/admin/inventory?view=history" className={tab("history")}>Riwayat</Link>
      </div>
    </div>
  );

  /* ---------------- RIWAYAT ---------------- */
  if (view === "history") {
    const where: Prisma.InventoryMovementWhereInput =
      variantFilter && /^[a-z0-9]{10,40}$/.test(variantFilter) ? { variantId: variantFilter } : {};

    const total = await prisma.inventoryMovement.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(pageWanted, totalPages);

    const rows = await prisma.inventoryMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        variant: { select: { size: true, sku: true, product: { select: { name: true } } } },
        orderItem: { select: { order: { select: { id: true, orderNumber: true } } } },
        createdBy: { select: { name: true } },
      },
    });

    const hrefFor = (p: number) => {
      const params = new URLSearchParams({ view: "history" });
      if (where.variantId) params.set("variant", String(where.variantId));
      if (p > 1) params.set("page", String(p));
      return `/admin/inventory?${params.toString()}`;
    };

    return (
      <div className="space-y-6">
        {header}
        {where.variantId && (
          <p className="text-sm">
            Menampilkan riwayat satu ukuran.{" "}
            <Link href="/admin/inventory?view=history" className="font-semibold underline">
              Tampilkan semua
            </Link>
          </p>
        )}
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center text-sm text-neutral-600">
            Belum ada riwayat pergerakan stok.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-stone-line bg-white">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-stone-line bg-mist text-xs uppercase tracking-wider text-neutral-500">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Waktu</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Produk</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Jenis</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Perubahan</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Stok</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-line">
                {rows.map((m) => (
                  <tr key={m.id}>
                    <td className="px-5 py-3 text-neutral-600">{formatTanggalWaktu(m.createdAt)}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium">{m.variant.product.name}</p>
                      <p className="text-xs text-neutral-500">Ukuran {m.variant.size} · {m.variant.sku}</p>
                    </td>
                    <td className="px-5 py-3">{MOVEMENT_LABEL[m.type] ?? m.type}</td>
                    <td className={cn("px-5 py-3 text-right font-semibold tabular-nums", m.quantityChange < 0 ? "text-red-600" : "text-emerald-700")}>
                      {m.quantityChange > 0 ? "+" : ""}{m.quantityChange}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-neutral-600">
                      {m.stockBefore} → {m.stockAfter}
                    </td>
                    <td className="px-5 py-3 text-xs text-neutral-600">
                      {m.orderItem ? (
                        <Link href={`/admin/orders/${m.orderItem.order.id}`} className="font-semibold underline">
                          {m.orderItem.order.orderNumber}
                        </Link>
                      ) : (
                        (m.note ?? "-")
                      )}
                      {m.createdBy && <span className="block text-neutral-400">oleh {m.createdBy.name}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pager page={page} totalPages={totalPages} hrefFor={hrefFor} />
      </div>
    );
  }

  /* ---------------- STOK ---------------- */
  const and: Prisma.ProductVariantWhereInput[] = [{ product: { archivedAt: null } }];
  if (q) {
    and.push({
      OR: [
        { sku: { contains: q, mode: "insensitive" } },
        { product: { name: { contains: q, mode: "insensitive" } } },
        { product: { sku: { contains: q, mode: "insensitive" } } },
      ],
    });
  }
  if (level === "out") and.push({ stock: 0 });
  if (level === "low") and.push({ stock: { gt: 0, lte: threshold } });
  const where: Prisma.ProductVariantWhereInput = { AND: and };

  const base: Prisma.ProductVariantWhereInput = { product: { archivedAt: null } };
  const [total, allCount, lowCount, outCount] = await Promise.all([
    prisma.productVariant.count({ where }),
    prisma.productVariant.count({ where: base }),
    prisma.productVariant.count({ where: { ...base, stock: { gt: 0, lte: threshold } } }),
    prisma.productVariant.count({ where: { ...base, stock: 0 } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(pageWanted, totalPages);

  const rows = await prisma.productVariant.findMany({
    where,
    orderBy: [{ product: { name: "asc" } }, { size: "asc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      size: true,
      sku: true,
      stock: true,
      isAvailable: true,
      product: { select: { name: true, sku: true, brand: { select: { name: true } } } },
    },
  });

  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (level !== "all") params.set("level", level);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return `/admin/inventory${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-6">
      {header}

      <dl className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-line bg-white p-5">
          <dt className="text-sm text-neutral-500">Total ukuran aktif</dt>
          <dd className="mt-1 text-3xl font-extrabold">{allCount}</dd>
        </div>
        <Link href="/admin/inventory?level=low" className="rounded-xl border border-amber-200 bg-amber-50 p-5 hover:border-amber-300">
          <dt className="text-sm text-amber-800">Stok rendah (≤ {threshold})</dt>
          <dd className="mt-1 text-3xl font-extrabold text-amber-800">{lowCount}</dd>
        </Link>
        <Link href="/admin/inventory?level=out" className="rounded-xl border border-red-200 bg-red-50 p-5 hover:border-red-300">
          <dt className="text-sm text-red-700">Stok habis</dt>
          <dd className="mt-1 text-3xl font-extrabold text-red-700">{outCount}</dd>
        </Link>
      </dl>

      <form
        action="/admin/inventory"
        method="get"
        role="search"
        aria-label="Filter stok"
        className="grid gap-3 rounded-2xl border border-stone-line bg-white p-4 sm:grid-cols-[1fr_200px_auto]"
      >
        <div>
          <label htmlFor="i-q" className="sr-only">Cari</label>
          <input id="i-q" name="q" type="search" defaultValue={q} placeholder="Nama produk atau SKU" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="i-level" className="sr-only">Tingkat stok</label>
          <select id="i-level" name="level" defaultValue={level} className={fieldClass}>
            <option value="all">Semua stok</option>
            <option value="low">Stok rendah</option>
            <option value="out">Stok habis</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="h-10 rounded-full bg-ink px-5 text-sm font-semibold text-paper hover:bg-neutral-800">Terapkan</button>
          <Link href="/admin/inventory" className="flex h-10 items-center rounded-full border border-stone-300 px-4 text-sm font-semibold hover:border-ink">Reset</Link>
        </div>
      </form>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
          <SearchX className="size-10 text-neutral-400" aria-hidden />
          <h2 className="mt-4 text-lg font-bold">Tidak ada data</h2>
          <p className="mt-1 text-sm text-neutral-600">Tidak ada ukuran yang cocok dengan filter.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-line bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-stone-line bg-mist text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Produk</th>
                <th scope="col" className="px-5 py-3 font-semibold">Ukuran</th>
                <th scope="col" className="px-5 py-3 font-semibold">SKU</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Stok</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-line">
              {rows.map((v) => (
                <tr key={v.id}>
                  <td className="px-5 py-3">
                    <p className="font-medium">{v.product.name}</p>
                    <p className="text-xs text-neutral-500">{v.product.brand.name}{!v.isAvailable && " · tidak tersedia"}</p>
                  </td>
                  <td className="px-5 py-3 font-semibold">{v.size}</td>
                  <td className="px-5 py-3 text-neutral-600">{v.sku}</td>
                  <td className="px-5 py-3 text-right">
                    <span
                      className={cn(
                        "inline-block min-w-10 rounded-full px-2.5 py-1 text-center text-xs font-bold tabular-nums",
                        v.stock === 0 && "bg-red-50 text-red-700",
                        v.stock > 0 && v.stock <= threshold && "bg-amber-50 text-amber-800",
                        v.stock > threshold && "bg-emerald-50 text-emerald-700"
                      )}
                    >
                      {v.stock}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/admin/inventory?view=history&variant=${v.id}`} className="text-xs font-semibold underline underline-offset-2">
                        Riwayat
                      </Link>
                      <StockAdjustButton variantId={v.id} label={`${v.product.name}, ukuran ${v.size}`} currentStock={v.stock} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pager page={page} totalPages={totalPages} hrefFor={hrefFor} />
    </div>
  );
}