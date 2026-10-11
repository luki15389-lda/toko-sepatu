import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import {
  FulfillmentBadge,
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/admin/status-badges";
import {
  ORDER_PAGE_SIZE,
  ORDER_SORTS,
  PAYMENT_STATUSES,
  adminOrderQuery,
  parseAdminOrderFilters,
  wibEnd,
  wibStart,
  type AdminOrderFilters,
} from "@/lib/admin/order-list";
import { requireAdmin } from "@/lib/auth/session";
import type { RawSearchParams } from "@/lib/catalog";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/order-labels";
import { ORDER_STATUSES } from "@/lib/orders/status-flow";
import { formatRupiah, formatTanggalWaktu } from "@/lib/utils";

export const metadata: Metadata = { title: "Pesanan" };

function buildWhere(f: AdminOrderFilters): Prisma.OrderWhereInput {
  const and: Prisma.OrderWhereInput[] = [];

  if (f.q) {
    const or: Prisma.OrderWhereInput[] = [
      { orderNumber: { contains: f.q, mode: "insensitive" } },
      { customerName: { contains: f.q, mode: "insensitive" } },
    ];
    const digits = f.q.replace(/\D/g, "");
    if (digits.length >= 4) {
      const normalized = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
      or.push({ customerWhatsapp: { contains: normalized } });
    }
    and.push({ OR: or });
  }
  if (f.status) and.push({ status: f.status });
  if (f.payment) and.push({ paymentStatus: f.payment });
  if (f.from) and.push({ createdAt: { gte: wibStart(f.from) } });
  if (f.to) and.push({ createdAt: { lte: wibEnd(f.to) } });

  return { AND: and };
}

function buildOrderBy(sort: AdminOrderFilters["sort"]): Prisma.OrderOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" };
    case "total_desc":
      return { total: "desc" };
    case "total_asc":
      return { total: "asc" };
    default:
      return { createdAt: "desc" };
  }
}

const fieldClass =
  "h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none focus:border-ink";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  await requireAdmin();
  const filters = parseAdminOrderFilters(await searchParams);
  const where = buildWhere(filters);

  const total = await prisma.order.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / ORDER_PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);

  const rows = await prisma.order.findMany({
    where,
    orderBy: buildOrderBy(filters.sort),
    skip: (page - 1) * ORDER_PAGE_SIZE,
    take: ORDER_PAGE_SIZE,
    select: {
      id: true,
      orderNumber: true,
      createdAt: true,
      customerName: true,
      customerWhatsapp: true,
      total: true,
      status: true,
      paymentStatus: true,
      fulfillmentStatus: true,
      dpPercentage: true,
    },
  });

  const hasFilter = Boolean(
    filters.q || filters.status || filters.payment || filters.from || filters.to
  );
  const pageHref = (p: number) => `/admin/orders${adminOrderQuery(filters, { page: p })}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Pesanan</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {total} pesanan{hasFilter ? " sesuai filter" : ""}.
        </p>
      </div>

      <form
        action="/admin/orders"
        method="get"
        role="search"
        aria-label="Filter pesanan"
        className="grid gap-3 rounded-2xl border border-stone-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="lg:col-span-2">
          <label htmlFor="o-q" className="sr-only">Cari pesanan</label>
          <input
            id="o-q"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="Cari nomor pesanan, nama, atau nomor WhatsApp"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="o-status" className="sr-only">Status pesanan</label>
          <select id="o-status" name="status" defaultValue={filters.status ?? ""} className={fieldClass}>
            <option value="">Semua status pesanan</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="o-payment" className="sr-only">Status pembayaran</label>
          <select id="o-payment" name="payment" defaultValue={filters.payment ?? ""} className={fieldClass}>
            <option value="">Semua status pembayaran</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>{PAYMENT_STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="o-from" className="mb-1 block text-xs font-semibold text-neutral-500">Dari tanggal</label>
          <input id="o-from" name="from" type="date" defaultValue={filters.from ?? ""} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="o-to" className="mb-1 block text-xs font-semibold text-neutral-500">Sampai tanggal</label>
          <input id="o-to" name="to" type="date" defaultValue={filters.to ?? ""} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="o-sort" className="mb-1 block text-xs font-semibold text-neutral-500">Urutkan</label>
          <select id="o-sort" name="sort" defaultValue={filters.sort} className={fieldClass}>
            {ORDER_SORTS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className="h-10 rounded-full bg-ink px-5 text-sm font-semibold text-paper hover:bg-neutral-800">
            Terapkan
          </button>
          <Link href="/admin/orders" className="flex h-10 items-center rounded-full border border-stone-300 px-4 text-sm font-semibold hover:border-ink">
            Reset
          </Link>
        </div>
      </form>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
          <SearchX className="size-10 text-neutral-400" aria-hidden />
          <h2 className="mt-4 text-lg font-bold">Pesanan tidak ditemukan</h2>
          <p className="mt-1 text-sm text-neutral-600">
            {hasFilter
              ? "Coba ubah atau hapus sebagian filter."
              : "Belum ada pesanan masuk."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-line bg-white">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b border-stone-line bg-mist text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Nomor pesanan</th>
                <th scope="col" className="px-5 py-3 font-semibold">Tanggal</th>
                <th scope="col" className="px-5 py-3 font-semibold">Pelanggan</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Total</th>
                <th scope="col" className="px-5 py-3 font-semibold">Pesanan</th>
                <th scope="col" className="px-5 py-3 font-semibold">Pembayaran</th>
                <th scope="col" className="px-5 py-3 font-semibold">Pengambilan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-line">
              {rows.map((o) => (
                <tr key={o.id} className="hover:bg-mist/60">
                  <td className="px-5 py-4">
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-neutral-600">{formatTanggalWaktu(o.createdAt)}</td>
                  <td className="px-5 py-4">
                    <p className="font-medium">{o.customerName}</p>
                    <p className="text-xs text-neutral-500">{o.customerWhatsapp}</p>
                  </td>
                  <td className="px-5 py-4 text-right font-semibold tabular-nums">
                    {formatRupiah(o.total)}
                  </td>
                  <td className="px-5 py-4"><OrderStatusBadge status={o.status} /></td>
                  <td className="px-5 py-4">
                    <PaymentStatusBadge status={o.paymentStatus} dpPercentage={o.dpPercentage} />
                  </td>
                  <td className="px-5 py-4"><FulfillmentBadge status={o.fulfillmentStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <nav aria-label="Halaman" className="flex items-center justify-between">
          <p className="text-sm text-neutral-600">Halaman {page} dari {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link href={pageHref(page - 1)} className="h-10 rounded-full border border-stone-300 px-5 text-sm font-semibold leading-10 hover:border-ink">Sebelumnya</Link>
            ) : (
              <span className="h-10 rounded-full border border-stone-200 px-5 text-sm font-semibold leading-10 text-stone-300">Sebelumnya</span>
            )}
            {page < totalPages ? (
              <Link href={pageHref(page + 1)} className="h-10 rounded-full border border-stone-300 px-5 text-sm font-semibold leading-10 hover:border-ink">Berikutnya</Link>
            ) : (
              <span className="h-10 rounded-full border border-stone-200 px-5 text-sm font-semibold leading-10 text-stone-300">Berikutnya</span>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}