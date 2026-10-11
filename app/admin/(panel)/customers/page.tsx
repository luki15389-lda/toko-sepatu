import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { Pager } from "@/components/admin/pager";
import { requireAdmin } from "@/lib/auth/session";
import type { RawSearchParams } from "@/lib/catalog";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { formatRupiah, formatTanggal } from "@/lib/utils";

export const metadata: Metadata = { title: "Pelanggan" };

const PAGE_SIZE = 20;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  await requireAdmin();
  const raw = await searchParams;

  const q = (first(raw.q) ?? "").trim().slice(0, 100);
  const pageRaw = first(raw.page);
  const pageWanted = pageRaw && /^\d{1,4}$/.test(pageRaw) ? Math.max(1, Number(pageRaw)) : 1;

  const digits = q.replace(/\D/g, "");
  const where: Prisma.CustomerWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          ...(digits.length >= 4
            ? [{ whatsapp: { contains: digits.startsWith("0") ? `62${digits.slice(1)}` : digits } }]
            : []),
        ],
      }
    : {};

  const total = await prisma.customer.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(pageWanted, totalPages);

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: { orders: { select: { total: true, status: true, createdAt: true } } },
  });

  const rows = customers.map((c) => {
    const valid = c.orders.filter((o) => o.status !== "CANCELLED");
    const last = c.orders.reduce<Date | null>(
      (max, o) => (!max || o.createdAt > max ? o.createdAt : max),
      null
    );
    return {
      id: c.id,
      name: c.name,
      whatsapp: c.whatsapp,
      orderCount: valid.length,
      spend: valid.reduce((s, o) => s + o.total, 0),
      last,
    };
  });

  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return `/admin/customers${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Pelanggan</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {total} pelanggan. Total transaksi tidak menghitung pesanan yang dibatalkan.
        </p>
      </div>

      <form action="/admin/customers" method="get" role="search" aria-label="Cari pelanggan" className="flex gap-3 rounded-2xl border border-stone-line bg-white p-4">
        <label htmlFor="c-q" className="sr-only">Cari pelanggan</label>
        <input id="c-q" name="q" type="search" defaultValue={q} placeholder="Cari nama atau nomor WhatsApp" className="h-10 w-full rounded-lg border border-stone-300 px-3 text-sm outline-none focus:border-ink" />
        <button type="submit" className="h-10 rounded-full bg-ink px-5 text-sm font-semibold text-paper hover:bg-neutral-800">Cari</button>
        <Link href="/admin/customers" className="flex h-10 items-center rounded-full border border-stone-300 px-4 text-sm font-semibold hover:border-ink">Reset</Link>
      </form>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
          <SearchX className="size-10 text-neutral-400" aria-hidden />
          <h2 className="mt-4 text-lg font-bold">Pelanggan tidak ditemukan</h2>
          <p className="mt-1 text-sm text-neutral-600">Pelanggan muncul otomatis saat ada pesanan pertama.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-line bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-stone-line bg-mist text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Pelanggan</th>
                <th scope="col" className="px-5 py-3 font-semibold">WhatsApp</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Pesanan</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Total transaksi</th>
                <th scope="col" className="px-5 py-3 font-semibold">Terakhir pesan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-line">
              {rows.map((c) => (
                <tr key={c.id}>
                  <td className="px-5 py-4">
                    <Link href={`/admin/customers/${c.id}`} className="font-semibold hover:underline">{c.name}</Link>
                  </td>
                  <td className="px-5 py-4 text-neutral-600">{c.whatsapp}</td>
                  <td className="px-5 py-4 text-right tabular-nums">{c.orderCount}</td>
                  <td className="px-5 py-4 text-right font-semibold tabular-nums">{formatRupiah(c.spend)}</td>
                  <td className="px-5 py-4 text-neutral-600">{c.last ? formatTanggal(c.last) : "-"}</td>
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