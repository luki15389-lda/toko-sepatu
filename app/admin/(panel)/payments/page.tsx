import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { Pager } from "@/components/admin/pager";
import { PaymentDecisionButtons } from "@/components/admin/payment-decision-buttons";
import { requireAdmin } from "@/lib/auth/session";
import type { RawSearchParams } from "@/lib/catalog";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import {
  PAYMENT_KIND_LABEL,
  PAYMENT_METHOD_LABEL,
  PAYMENT_RECORD_STATUS_LABEL,
} from "@/lib/order-labels";
import { cn, formatRupiah, formatTanggal } from "@/lib/utils";

export const metadata: Metadata = { title: "Pembayaran" };

const PAGE_SIZE = 20;
const STATUSES = ["PENDING_VERIFICATION", "VERIFIED", "REJECTED"] as const;
const KINDS = ["DP", "INSTALLMENT", "FULL", "REFUND"] as const;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const fieldClass =
  "h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none focus:border-ink";

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  await requireAdmin();
  const raw = await searchParams;

  const q = (first(raw.q) ?? "").trim().slice(0, 100);
  const status = STATUSES.find((s) => s === first(raw.status));
  const kind = KINDS.find((k) => k === first(raw.kind));
  const pageRaw = first(raw.page);
  const pageWanted = pageRaw && /^\d{1,4}$/.test(pageRaw) ? Math.max(1, Number(pageRaw)) : 1;

  const where: Prisma.PaymentWhereInput = {
    ...(status ? { status } : {}),
    ...(kind ? { kind } : {}),
    ...(q
      ? {
          order: {
            OR: [
              { orderNumber: { contains: q, mode: "insensitive" } },
              { customerName: { contains: q, mode: "insensitive" } },
            ],
          },
        }
      : {}),
  };

  const [total, pendingCount] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.count({ where: { status: "PENDING_VERIFICATION" } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(pageWanted, totalPages);

  const rows = await prisma.payment.findMany({
    where,
    orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      order: { select: { id: true, orderNumber: true, customerName: true } },
      verifiedBy: { select: { name: true } },
    },
  });

  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (kind) params.set("kind", kind);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return `/admin/payments${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Pembayaran</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {total} catatan pembayaran. Pencatatan baru dilakukan dari halaman detail pesanan.
        </p>
      </div>

      {pendingCount > 0 && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Ada <strong>{pendingCount}</strong> pembayaran menunggu verifikasi.{" "}
          <Link href="/admin/payments?status=PENDING_VERIFICATION" className="font-semibold underline">
            Lihat
          </Link>
        </p>
      )}

      <form
        action="/admin/payments"
        method="get"
        role="search"
        aria-label="Filter pembayaran"
        className="grid gap-3 rounded-2xl border border-stone-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_auto]"
      >
        <div>
          <label htmlFor="p-q" className="sr-only">Cari</label>
          <input id="p-q" name="q" type="search" defaultValue={q} placeholder="Nomor pesanan atau nama pelanggan" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="p-status" className="sr-only">Status</label>
          <select id="p-status" name="status" defaultValue={status ?? ""} className={fieldClass}>
            <option value="">Semua status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{PAYMENT_RECORD_STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="p-kind" className="sr-only">Jenis</label>
          <select id="p-kind" name="kind" defaultValue={kind ?? ""} className={fieldClass}>
            <option value="">Semua jenis</option>
            {KINDS.map((k) => (
              <option key={k} value={k}>{PAYMENT_KIND_LABEL[k]}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="h-10 rounded-full bg-ink px-5 text-sm font-semibold text-paper hover:bg-neutral-800">Terapkan</button>
          <Link href="/admin/payments" className="flex h-10 items-center rounded-full border border-stone-300 px-4 text-sm font-semibold hover:border-ink">Reset</Link>
        </div>
      </form>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
          <SearchX className="size-10 text-neutral-400" aria-hidden />
          <h2 className="mt-4 text-lg font-bold">Belum ada pembayaran</h2>
          <p className="mt-1 text-sm text-neutral-600">Tidak ada catatan yang cocok dengan filter.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-line bg-white">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-stone-line bg-mist text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Tanggal</th>
                <th scope="col" className="px-5 py-3 font-semibold">Pesanan</th>
                <th scope="col" className="px-5 py-3 font-semibold">Jenis</th>
                <th scope="col" className="px-5 py-3 font-semibold">Metode</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Nominal</th>
                <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                <th scope="col" className="px-5 py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-line">
              {rows.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-4 text-neutral-600">{formatTanggal(p.paidAt)}</td>
                  <td className="px-5 py-4">
                    <Link href={`/admin/orders/${p.order.id}`} className="font-semibold hover:underline">
                      {p.order.orderNumber}
                    </Link>
                    <p className="text-xs text-neutral-500">{p.order.customerName}</p>
                  </td>
                  <td className="px-5 py-4">{PAYMENT_KIND_LABEL[p.kind] ?? p.kind}</td>
                  <td className="px-5 py-4 text-neutral-600">
                    {p.method === "OTHER" && p.methodLabel ? p.methodLabel : (PAYMENT_METHOD_LABEL[p.method] ?? p.method)}
                  </td>
                  <td className={cn("px-5 py-4 text-right font-semibold tabular-nums", p.kind === "REFUND" && "text-violet-700")}>
                    {p.kind === "REFUND" ? "-" : ""}
                    {formatRupiah(p.amount)}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "inline-block rounded-full px-2.5 py-1 text-xs font-semibold",
                        p.status === "VERIFIED" && "bg-emerald-50 text-emerald-700",
                        p.status === "PENDING_VERIFICATION" && "bg-amber-50 text-amber-700",
                        p.status === "REJECTED" && "bg-red-50 text-red-700"
                      )}
                    >
                      {PAYMENT_RECORD_STATUS_LABEL[p.status] ?? p.status}
                    </span>
                    {p.verifiedBy && <p className="mt-1 text-xs text-neutral-500">oleh {p.verifiedBy.name}</p>}
                  </td>
                  <td className="px-5 py-4">
                    {p.status === "PENDING_VERIFICATION" ? <PaymentDecisionButtons paymentId={p.id} /> : null}
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