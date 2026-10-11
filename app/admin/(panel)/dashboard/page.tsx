import type { Metadata } from "next";
import Link from "next/link";
import { BarChart } from "@/components/admin/bar-chart";
import { StatCard } from "@/components/admin/stat-card";
import { OrderStatusBadge } from "@/components/admin/status-badges";
import { ACTIVITY_LABEL, summarizeMetadata } from "@/lib/admin/activity-labels";
import { getLowStock, getPeriodStats, parsePeriod, shiftDate } from "@/lib/admin/stats";
import { requireAdmin } from "@/lib/auth/session";
import type { RawSearchParams } from "@/lib/catalog";
import { prisma } from "@/lib/db/prisma";
import { formatRupiah, formatTanggal, formatTanggalWaktu, todayWib } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const admin = await requireAdmin();
  const raw = await searchParams;
  const period = parsePeriod(first(raw.from), first(raw.to));
  const today = todayWib();

  const [stats, low, recentOrders, activity] = await Promise.all([
    getPeriodStats(period),
    getLowStock(5),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, orderNumber: true, customerName: true, total: true, status: true },
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { admin: { select: { name: true } } },
    }),
  ]);

  const presets = [
    { label: "7 hari", from: shiftDate(today, -6) },
    { label: "30 hari", from: shiftDate(today, -29) },
    { label: "90 hari", from: shiftDate(today, -89) },
    { label: "Bulan ini", from: `${today.slice(0, 7)}-01` },
  ];

  const fieldClass =
    "h-10 rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none focus:border-ink";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold">Halo, {admin.name}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Ringkasan toko untuk periode{" "}
          <strong>{formatTanggal(`${period.from}T00:00:00+07:00`)}</strong> sampai{" "}
          <strong>{formatTanggal(`${period.to}T00:00:00+07:00`)}</strong>.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <form action="/admin/dashboard" method="get" className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="d-from" className="mb-1 block text-xs font-semibold text-neutral-500">Dari</label>
            <input id="d-from" name="from" type="date" defaultValue={period.from} className={fieldClass} />
          </div>
          <div>
            <label htmlFor="d-to" className="mb-1 block text-xs font-semibold text-neutral-500">Sampai</label>
            <input id="d-to" name="to" type="date" defaultValue={period.to} className={fieldClass} />
          </div>
          <button type="submit" className="h-10 rounded-full bg-ink px-5 text-sm font-semibold text-paper hover:bg-neutral-800">
            Terapkan
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <Link
              key={p.label}
              href={`/admin/dashboard?from=${p.from}&to=${today}`}
              className="h-10 rounded-full border border-stone-300 px-4 text-sm font-semibold leading-10 hover:border-ink"
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      <section aria-labelledby="h-periode" className="space-y-3">
        <h2 id="h-periode" className="text-sm font-bold uppercase tracking-wider text-neutral-500">
          Pada periode ini
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total pesanan" value={stats.totalOrders} hint={`${stats.cancelledCount} dibatalkan`} />
          <StatCard label="Nilai pesanan" value={formatRupiah(stats.orderValue)} hint="Tanpa pesanan dibatalkan" />
          <StatCard label="Pembayaran diterima" value={formatRupiah(stats.receivedNet)} hint="Terverifikasi, setelah pengembalian dana" />
          <StatCard label="Pendapatan (pesanan selesai)" value={formatRupiah(stats.completedRevenue)} hint={`${stats.completedCount} pesanan selesai`} />
        </div>

        <details className="rounded-xl bg-mist px-4 py-3 text-sm">
          <summary className="cursor-pointer font-semibold">Apa bedanya ketiga angka uang ini?</summary>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-neutral-700">
            <li><strong>Nilai pesanan:</strong> jumlah total semua pesanan yang dibuat pada periode (selain yang dibatalkan), walau belum dibayar.</li>
            <li><strong>Pembayaran diterima:</strong> uang yang benar-benar masuk dan sudah diverifikasi admin pada periode, dikurangi pengembalian dana.</li>
            <li><strong>Pendapatan:</strong> total pesanan yang berstatus Selesai (lunas dan sudah diambil) pada periode.</li>
          </ul>
        </details>
      </section>

      <section aria-labelledby="h-antrean" className="space-y-3">
        <h2 id="h-antrean" className="text-sm font-bold uppercase tracking-wider text-neutral-500">
          Antrean pesanan saat ini
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Menunggu konfirmasi" value={stats.queue.PENDING_CONFIRMATION ?? 0} href="/admin/orders?status=PENDING_CONFIRMATION" tone={(stats.queue.PENDING_CONFIRMATION ?? 0) > 0 ? "warn" : "default"} />
          <StatCard label="Menunggu pembayaran" value={stats.queue.AWAITING_PAYMENT ?? 0} href="/admin/orders?status=AWAITING_PAYMENT" />
          <StatCard label="Sedang diproses" value={stats.queue.PROCESSING ?? 0} href="/admin/orders?status=PROCESSING" />
          <StatCard label="Siap diambil" value={stats.queue.READY_FOR_PICKUP ?? 0} href="/admin/orders?status=READY_FOR_PICKUP" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Tagihan tersisa" value={formatRupiah(stats.outstanding)} hint="Seluruh pesanan aktif (tidak dibatalkan)" />
          <StatCard label="Stok rendah / habis" value={low.count} hint={`Ukuran dengan stok ≤ ${low.threshold}`} href="/admin/inventory?level=low" tone={low.count > 0 ? "warn" : "default"} />
          <StatCard label="Pesanan selesai (periode)" value={stats.completedCount} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <BarChart
          title="Nilai pesanan per hari"
          data={stats.daily.map((d) => ({ label: d.date, value: d.value }))}
          format={formatRupiah}
        />
        <BarChart
          title="Jumlah pesanan per hari"
          data={stats.daily.map((d) => ({ label: d.date, value: d.orders }))}
          format={(n) => `${n} pesanan`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-stone-line bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold">Pesanan terbaru</h2>
            <Link href="/admin/orders" className="text-xs font-semibold underline underline-offset-2">Lihat semua</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-neutral-500">Belum ada pesanan.</p>
          ) : (
            <ul className="divide-y divide-stone-line">
              {recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:underline">{o.orderNumber}</Link>
                    <p className="truncate text-xs text-neutral-500">{o.customerName} · {formatRupiah(o.total)}</p>
                  </div>
                  <OrderStatusBadge status={o.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-stone-line bg-white p-6">
          <h2 className="mb-4 text-base font-bold">Produk terlaris (periode)</h2>
          {stats.topProducts.length === 0 ? (
            <p className="text-sm text-neutral-500">Belum ada penjualan pada periode ini.</p>
          ) : (
            <ol className="divide-y divide-stone-line">
              {stats.topProducts.slice(0, 5).map((p, i) => (
                <li key={p.name} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="min-w-0">
                    <span className="mr-2 text-neutral-400">{i + 1}.</span>
                    <span className="font-semibold">{p.name}</span>
                  </span>
                  <span className="shrink-0 text-xs text-neutral-600">{p.quantity} pasang · {formatRupiah(p.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="rounded-2xl border border-stone-line bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold">Stok rendah</h2>
            <Link href="/admin/inventory?level=low" className="text-xs font-semibold underline underline-offset-2">Kelola stok</Link>
          </div>
          {low.rows.length === 0 ? (
            <p className="text-sm text-neutral-500">Semua stok aman.</p>
          ) : (
            <ul className="divide-y divide-stone-line">
              {low.rows.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span>{v.product.name}, ukuran {v.size}</span>
                  <span className={v.stock === 0 ? "font-bold text-red-600" : "font-bold text-amber-700"}>
                    {v.stock === 0 ? "Habis" : `Sisa ${v.stock}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-stone-line bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold">Aktivitas admin terbaru</h2>
            <Link href="/admin/activity-logs" className="text-xs font-semibold underline underline-offset-2">Lihat semua</Link>
          </div>
          {activity.length === 0 ? (
            <p className="text-sm text-neutral-500">Belum ada aktivitas.</p>
          ) : (
            <ul className="divide-y divide-stone-line">
              {activity.map((a) => (
                <li key={a.id} className="py-3 text-sm">
                  <p className="font-semibold">{ACTIVITY_LABEL[a.action] ?? a.action}</p>
                  <p className="text-xs text-neutral-500">
                    {a.admin?.name ?? "Sistem"} · {formatTanggalWaktu(a.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}