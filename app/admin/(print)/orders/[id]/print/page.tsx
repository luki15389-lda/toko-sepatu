import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/admin/print-button";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getStoreSettings } from "@/lib/data/store";
import { ORDER_STATUS_LABEL, paymentLabel } from "@/lib/order-labels";
import { formatRupiah, formatTanggalWaktu } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ringkasan Pesanan",
  robots: { index: false, follow: false },
};

async function PrintContent({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const [order, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: { items: { orderBy: { id: "asc" } } },
    }),
    getStoreSettings(),
  ]);
  if (!order) notFound();

  return (
    <main className="mx-auto max-w-2xl p-8 text-sm text-black">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-2xl font-extrabold">{settings.storeName}</p>
          {settings.address && <p className="mt-1 text-neutral-600">{settings.address}</p>}
        </div>
        <PrintButton />
      </div>

      <h1 className="text-lg font-bold">Ringkasan Pesanan {order.orderNumber}</h1>
      <p className="text-neutral-600">Dibuat {formatTanggalWaktu(order.createdAt)}</p>

      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <dt className="text-xs text-neutral-500">Pelanggan</dt>
          <dd className="font-semibold">{order.customerName}</dd>
          <dd>{order.customerWhatsapp}</dd>
        </div>
        <div>
          <dt className="text-xs text-neutral-500">Status</dt>
          <dd className="font-semibold">{ORDER_STATUS_LABEL[order.status] ?? order.status}</dd>
          <dd>{paymentLabel(order.paymentStatus, order.dpPercentage)}</dd>
        </div>
      </dl>

      <table className="mt-6 w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-black">
            <th className="py-2 pr-2">Produk</th>
            <th className="py-2 pr-2">Ukuran</th>
            <th className="py-2 pr-2 text-right">Jml</th>
            <th className="py-2 pr-2 text-right">Harga</th>
            <th className="py-2 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((it) => (
            <tr key={it.id} className="border-b border-neutral-300">
              <td className="py-2 pr-2">
                {it.productName}
                <span className="block text-xs text-neutral-500">{it.brandName}</span>
              </td>
              <td className="py-2 pr-2">{it.size}</td>
              <td className="py-2 pr-2 text-right">{it.quantity}</td>
              <td className="py-2 pr-2 text-right">{formatRupiah(it.unitPrice)}</td>
              <td className="py-2 text-right">{formatRupiah(it.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="ml-auto mt-4 w-64 space-y-1.5">
        <div className="flex justify-between">
          <dt>Total</dt>
          <dd className="font-bold">{formatRupiah(order.total)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Terbayar (terverifikasi)</dt>
          <dd>{formatRupiah(order.paidAmount)}</dd>
        </div>
        <div className="flex justify-between border-t border-black pt-1.5">
          <dt>Sisa tagihan</dt>
          <dd className="font-bold">{formatRupiah(order.total - order.paidAmount)}</dd>
        </div>
      </dl>

      <p className="mt-8 text-xs text-neutral-500">
        Pengambilan: langsung di toko. Dokumen ini adalah ringkasan pesanan,
        bukan bukti pembayaran.
      </p>
    </main>
  );
}

export default function PrintOrderPage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="p-8 text-sm">Memuat...</p>}>
      <PrintContent {...props} />
    </Suspense>
  );
}