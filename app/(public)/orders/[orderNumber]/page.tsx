import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { RememberOrder } from "@/components/store/remember-order";
import { DetailSkeleton } from "@/components/store/skeletons";
import { getOrderForCustomer } from "@/lib/data/orders";
import { getStoreSettings } from "@/lib/data/store";
import {
  FULFILLMENT_STATUS_LABEL,
  ORDER_STATUS_HELP,
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
} from "@/lib/order-labels";
import { buildOrderWhatsAppMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { formatRupiah, formatTanggalWaktu } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ringkasan Pesanan",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ t?: string | string[] }>;
};

async function OrderContent({ params, searchParams }: Props) {
  const { orderNumber } = await params;
  const { t } = await searchParams;
  const token = Array.isArray(t) ? t[0] : t;

  const [order, settings] = await Promise.all([
    getOrderForCustomer(orderNumber, token),
    getStoreSettings(),
  ]);
  // Nomor salah, token salah, atau token tidak ada: tampilkan 404 yang sama
  if (!order || !token) notFound();

  const waUrl = settings.whatsappNumber
    ? buildWhatsAppUrl(
        settings.whatsappNumber,
        buildOrderWhatsAppMessage({
          storeName: settings.storeName,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          total: order.total,
          items: order.items,
        })
      )
    : null;

  const remaining = order.total - order.paidAmount;
  const paymentLabel =
    order.paymentStatus === "DP_PARTIAL"
      ? `DP ${order.dpPercentage}% Terverifikasi`
      : (PAYMENT_STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus);

  const pending = order.status === "PENDING_CONFIRMATION";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
      <RememberOrder orderNumber={order.orderNumber} token={token} />

      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
        Nomor pesanan
      </p>
      <h1 className="mt-1 text-3xl font-extrabold">{order.orderNumber}</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Dibuat {formatTanggalWaktu(order.createdAt)}
      </p>

      <section
        aria-label="Status pesanan"
        className="mt-6 rounded-2xl border border-stone-line p-6"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Status
        </p>
        <p className="mt-1 text-xl font-extrabold">
          {ORDER_STATUS_LABEL[order.status] ?? order.status}
        </p>
        <p className="mt-1 text-sm text-neutral-600">
          {ORDER_STATUS_HELP[order.status]}
        </p>
        {order.status === "CANCELLED" && order.cancelReason && (
          <p className="mt-2 text-sm">
            <span className="font-semibold">Alasan: </span>
            {order.cancelReason}
          </p>
        )}
        {order.customerNote && (
          <p className="mt-3 rounded-xl bg-mist p-3 text-sm">
            <span className="font-semibold">Catatan dari toko: </span>
            {order.customerNote}
          </p>
        )}
      </section>

      {pending && waUrl && (
        <section className="mt-6 rounded-2xl bg-ink p-6 text-paper">
          <h2 className="text-lg font-bold">Langkah selanjutnya</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-300">
            Pesanan Anda sudah tercatat, tetapi{" "}
            <strong>belum dikonfirmasi</strong>. Kirim pesan konfirmasi ke
            penjual lewat WhatsApp. Pesan sudah disiapkan, Anda tinggal menekan
            kirim. Kami tidak mengirim pesan apa pun atas nama Anda.
          </p>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-accent px-7 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <MessageCircle className="size-4" aria-hidden />
            Kirim Konfirmasi via WhatsApp
          </a>
        </section>
      )}

      <section aria-label="Daftar produk" className="mt-8">
        <h2 className="mb-2 text-lg font-bold">Produk</h2>
        <ul className="divide-y divide-stone-line border-y border-stone-line">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-4 py-4">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-mist">
                <Image
                  src={item.imageUrl ?? "/placeholder-shoe.svg"}
                  alt={item.productName}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  {item.brandName}
                </p>
                <p className="font-semibold">{item.productName}</p>
                <p className="text-neutral-600">
                  Ukuran {item.size} x {item.quantity} @{" "}
                  {formatRupiah(item.unitPrice)}
                </p>
              </div>
              <p className="shrink-0 text-sm font-bold">
                {formatRupiah(item.lineTotal)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Pembayaran" className="mt-8 rounded-2xl bg-mist p-6 text-sm">
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt>Total pesanan</dt>
            <dd className="text-lg font-extrabold">{formatRupiah(order.total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-600">Status pembayaran</dt>
            <dd className="font-semibold">{paymentLabel}</dd>
          </div>
          {order.paymentStatus === "UNPAID" && (
            <div className="flex justify-between text-neutral-600">
              <dt>Perkiraan DP ({order.dpPercentage}%)</dt>
              <dd>{formatRupiah(order.dpAmount)}</dd>
            </div>
          )}
          {order.paidAmount > 0 && (
            <>
              <div className="flex justify-between">
                <dt className="text-neutral-600">Pembayaran terverifikasi</dt>
                <dd className="font-semibold">{formatRupiah(order.paidAmount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-600">Sisa tagihan</dt>
                <dd className="font-semibold">{formatRupiah(remaining)}</dd>
              </div>
            </>
          )}
          <div className="flex justify-between">
            <dt className="text-neutral-600">Status pengambilan</dt>
            <dd className="font-semibold">
              {FULFILLMENT_STATUS_LABEL[order.fulfillmentStatus] ??
                order.fulfillmentStatus}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-neutral-500">
          Pembayaran baru dianggap diterima setelah diverifikasi admin toko.
          Nominal DP final disepakati bersama penjual.
        </p>
      </section>

      <section aria-label="Pengambilan" className="mt-6 rounded-2xl border border-stone-line p-6 text-sm">
        <h2 className="font-bold">Ambil di toko</h2>
        {settings.address && <p className="mt-2 text-neutral-700">{settings.address}</p>}
        {settings.openingHours && (
          <p className="mt-2 whitespace-pre-line text-neutral-700">
            {settings.openingHours}
          </p>
        )}
        {settings.pickupInstructions && (
          <p className="mt-2 text-neutral-700">{settings.pickupInstructions}</p>
        )}
      </section>

      {!pending && waUrl && (
        <a
          href={buildWhatsAppUrl(
            settings.whatsappNumber,
            `Halo ${settings.storeName}, saya ingin bertanya tentang pesanan ${order.orderNumber}.`
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-full border border-ink px-6 text-sm font-semibold transition hover:bg-ink hover:text-paper"
        >
          <MessageCircle className="size-4" aria-hidden />
          Hubungi penjual via WhatsApp
        </a>
      )}

      <p className="mt-8 text-xs leading-relaxed text-neutral-500">
        Simpan tautan halaman ini. Hanya orang yang memiliki tautan ini yang
        dapat melihat pesanan Anda.
      </p>
      <Link
        href="/products"
        className="mt-4 inline-block text-sm font-semibold underline underline-offset-4"
      >
        Kembali berbelanja
      </Link>
    </div>
  );
}

export default function OrderPage(props: Props) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <OrderContent {...props} />
    </Suspense>
  );
}