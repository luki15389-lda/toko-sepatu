import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/status-badges";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { formatRupiah, formatTanggal, formatTanggalWaktu } from "@/lib/utils";

export const metadata: Metadata = { title: "Detail Pelanggan" };

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          createdAt: true,
          total: true,
          status: true,
          paymentStatus: true,
          dpPercentage: true,
        },
      },
    },
  });
  if (!customer) notFound();

  const valid = customer.orders.filter((o) => o.status !== "CANCELLED");
  const spend = valid.reduce((s, o) => s + o.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: "Pelanggan", href: "/admin/customers" }, { label: customer.name }]} />
        <h1 className="mt-3 text-2xl font-extrabold">{customer.name}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-line bg-white p-5">
          <p className="text-sm text-neutral-500">WhatsApp</p>
          <p className="mt-1 font-bold">{customer.whatsapp}</p>
          <a
            href={buildWhatsAppUrl(customer.whatsapp, `Halo ${customer.name}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex h-9 items-center gap-2 rounded-full border border-ink px-4 text-xs font-semibold hover:bg-ink hover:text-paper"
          >
            <MessageCircle className="size-3.5" aria-hidden />
            Chat
          </a>
        </div>
        <div className="rounded-xl border border-stone-line bg-white p-5">
          <p className="text-sm text-neutral-500">Total transaksi</p>
          <p className="mt-1 text-2xl font-extrabold">{formatRupiah(spend)}</p>
          <p className="mt-1 text-xs text-neutral-500">{valid.length} pesanan (tanpa yang dibatalkan)</p>
        </div>
        <div className="rounded-xl border border-stone-line bg-white p-5">
          <p className="text-sm text-neutral-500">Pelanggan sejak</p>
          <p className="mt-1 font-bold">{formatTanggal(customer.createdAt)}</p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Riwayat pesanan</h2>
        <div className="overflow-x-auto rounded-2xl border border-stone-line bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-stone-line bg-mist text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Nomor pesanan</th>
                <th scope="col" className="px-5 py-3 font-semibold">Tanggal</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Total</th>
                <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                <th scope="col" className="px-5 py-3 font-semibold">Pembayaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-line">
              {customer.orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-5 py-4">
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:underline">{o.orderNumber}</Link>
                  </td>
                  <td className="px-5 py-4 text-neutral-600">{formatTanggalWaktu(o.createdAt)}</td>
                  <td className="px-5 py-4 text-right font-semibold tabular-nums">{formatRupiah(o.total)}</td>
                  <td className="px-5 py-4"><OrderStatusBadge status={o.status} /></td>
                  <td className="px-5 py-4"><PaymentStatusBadge status={o.paymentStatus} dpPercentage={o.dpPercentage} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}