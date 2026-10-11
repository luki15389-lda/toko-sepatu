import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { getLowStock, getPeriodStats, parsePeriod, periodRange } from "@/lib/admin/stats";
import { requireAdmin } from "@/lib/auth/session";
import type { RawSearchParams } from "@/lib/catalog";
import { prisma } from "@/lib/db/prisma";
import { ORDER_STATUS_LABEL } from "@/lib/order-labels";
import { ORDER_STATUSES } from "@/lib/orders/status-flow";
import { formatRupiah, formatTanggal, formatTanggalWaktu } from "@/lib/utils";

export const metadata: Metadata = { title: "Laporan" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const admin = await requireAdmin();
  const raw = await searchParams;
  const period = parsePeriod(first(raw.from), first(raw.to));

  const [stats, low, history] = await Promise.all([
    getPeriodStats(period),
    getLowStock(10),
    prisma.orderStatusHistory.findMany({
      where: { kind: "ORDER", createdAt: periodRange(period) },
      orderBy: { createdAt: "desc" },
      take: 15,
      include: {
        order: { select: { id: true, orderNumber: true } },
        changedBy: { select: { name: true } },
      },
    }),
  ]);

  const activeDays = stats.daily.filter((d) => d.orders > 0).reverse();
  const query = `from=${period.from}&to=${period.to}`;
  const canExport = admin.role === "ADMIN";
  const fieldClass =
    "h-10 rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none focus:border-ink";
  const th = "px-5 py-3 font-semibold";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold">Laporan</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Periode {formatTanggal(`${period.from}T00:00:00+07:00`)} sampai{" "}
          {formatTanggal(`${period.to}T00:00:00+07:00`)}. Semua angka dihitung dari data transaksi.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <form action="/admin/reports" method="get" className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="r-from" className="mb-1 block text-xs font-semibold text-neutral-500">Dari</label>
            <input id="r-from" name="from" type="date" defaultValue={period.from} className={fieldClass} />
          </div>
          <div>
            <label htmlFor="r-to" className="mb-1 block text-xs font-semibold text-neutral-500">Sampai</label>
            <input id="r-to" name="to" type="date" defaultValue={period.to} className={fieldClass} />
          </div>
          <button type="submit" className="h-10 rounded-full bg-ink px-5 text-sm font-semibold text-paper hover:bg-neutral-800">
            Terapkan
          </button>
        </form>

        {canExport ? (
          <div className="flex flex-wrap gap-2">
            <a href={`/admin/reports/export?type=orders&${query}`} className="inline-flex h-10 items-center gap-2 rounded-full border border-stone-300 px-4 text-sm font-semibold hover:border-ink">
              <Download className="size-4" aria-hidden />
              Ekspor pesanan (CSV)
            </a>
            <a href="/admin/reports/export?type=stock" className="inline-flex h-10 items-center gap-2 rounded-full border border-stone-300 px-4 text-sm font-semibold hover:border-ink">
              <Download className="size-4" aria-hidden />
              Ekspor stok (CSV)
            </a>
          </div>
        ) : (
          <p className="text-xs text-neutral-500">Ekspor CSV tidak tersedia di akun demo.</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Jumlah pesanan" value={stats.totalOrders} />
        <StatCard label="Pesanan selesai" value={stats.completedCount} hint={formatRupiah(stats.completedRevenue)} />
        <StatCard label="Pesanan dibatalkan" value={stats.cancelledCount} tone={stats.cancelledCount > 0 ? "warn" : "default"} />
        <StatCard label="Nilai pesanan" value={formatRupiah(stats.orderValue)} />
        <StatCard label="Pembayaran terverifikasi" value={formatRupiah(stats.receivedNet)} />
        <StatCard label="Tagihan tersisa (semua aktif)" value={formatRupiah(stats.outstanding)} />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Penjualan per hari</h2>
        {activeDays.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center text-sm text-neutral-600">
            Tidak ada pesanan pada periode ini.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-stone-line bg-white">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="border-b border-stone-line bg-mist text-xs uppercase tracking-wider text-neutral-500">
                <tr>
                  <th scope="col" className={th}>Tanggal</th>
                  <th scope="col" className={`${th} text-right`}>Pesanan</th>
                  <th scope="col" className={`${th} text-right`}>Nilai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-line">
                {activeDays.map((d) => (
                  <tr key={d.date}>
                    <td className="px-5 py-3">{formatTanggal(`${d.date}T00:00:00+07:00`)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{d.orders}</td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums">{formatRupiah(d.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-lg font-bold">Pesanan menurut status</h2>
          <ul className="divide-y divide-stone-line rounded-2xl border border-stone-line bg-white text-sm">
            {ORDER_STATUSES.map((s) => (
              <li key={s} className="flex justify-between px-5 py-3">
                <span>{ORDER_STATUS_LABEL[s]}</span>
                <span className="font-semibold tabular-nums">{stats.periodStatus[s] ?? 0}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold">Produk terlaris</h2>
          {stats.topProducts.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center text-sm text-neutral-600">
              Belum ada penjualan pada periode ini.
            </p>
          ) : (
            <ol className="divide-y divide-stone-line rounded-2xl border border-stone-line bg-white text-sm">
              {stats.topProducts.map((p, i) => (
                <li key={p.name} className="flex justify-between gap-3 px-5 py-3">
                  <span><span className="mr-2 text-neutral-400">{i + 1}.</span>{p.name}</span>
                  <span className="shrink-0 text-xs text-neutral-600">{p.quantity} pasang · {formatRupiah(p.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Stok rendah / habis</h2>
          <Link href="/admin/inventory" className="text-xs font-semibold underline underline-offset-2">Kelola stok</Link>
        </div>
        {low.rows.length === 0 ? (
          <p className="text-sm text-neutral-500">Semua stok aman.</p>
        ) : (
          <ul className="divide-y divide-stone-line rounded-2xl border border-stone-line bg-white text-sm">
            {low.rows.map((v) => (
              <li key={v.id} className="flex justify-between px-5 py-3">
                <span>{v.product.name}, ukuran {v.size}</span>
                <span className={v.stock === 0 ? "font-bold text-red-600" : "font-bold text-amber-700"}>
                  {v.stock === 0 ? "Habis" : `Sisa ${v.stock}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Perubahan status pesanan terbaru</h2>
        {history.length === 0 ? (
          <p className="text-sm text-neutral-500">Tidak ada perubahan pada periode ini.</p>
        ) : (
          <ul className="divide-y divide-stone-line rounded-2xl border border-stone-line bg-white text-sm">
            {history.map((h) => (
              <li key={h.id} className="flex flex-wrap justify-between gap-2 px-5 py-3">
                <span>
                  <Link href={`/admin/orders/${h.order.id}`} className="font-semibold hover:underline">{h.order.orderNumber}</Link>{" "}
                  {h.fromValue ? `${ORDER_STATUS_LABEL[h.fromValue] ?? h.fromValue} → ` : ""}
                  {ORDER_STATUS_LABEL[h.toValue] ?? h.toValue}
                </span>
                <span className="text-xs text-neutral-500">
                  {formatTanggalWaktu(h.createdAt)} · {h.changedBy?.name ?? "Sistem / pelanggan"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}