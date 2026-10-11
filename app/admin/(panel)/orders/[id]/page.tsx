import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MessageCircle, Printer } from "lucide-react";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { OrderActions } from "@/components/admin/order-actions";
import { OrderNotesForm } from "@/components/admin/order-notes-form";
import {
  FulfillmentBadge,
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/admin/status-badges";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getStoreSettings } from "@/lib/data/store";
import {
  FULFILLMENT_STATUS_LABEL,
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
} from "@/lib/order-labels";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { formatRupiah, formatTanggalWaktu } from "@/lib/utils";
import { PaymentPanel } from "@/components/admin/payment-panel";
import { OrderAccessLink } from "@/components/admin/order-access-link";

export const metadata: Metadata = { title: "Detail Pesanan" };

const KIND_LABEL: Record<string, string> = {
  ORDER: "Pesanan",
  PAYMENT: "Pembayaran",
  FULFILLMENT: "Pengambilan",
};

const VALUE_LABEL: Record<string, Record<string, string>> = {
  ORDER: ORDER_STATUS_LABEL,
  PAYMENT: PAYMENT_STATUS_LABEL,
  FULFILLMENT: FULFILLMENT_STATUS_LABEL,
};

const PAYMENT_KIND_LABEL: Record<string, string> = {
  DP: "DP",
  INSTALLMENT: "Pembayaran lanjutan",
  FULL: "Pelunasan",
  REFUND: "Pengembalian dana",
};

const METHOD_LABEL: Record<string, string> = {
  BANK_TRANSFER: "Transfer bank",
  CASH: "Tunai di toko",
  OTHER: "Lainnya",
};

const RECORD_STATUS_LABEL: Record<string, string> = {
  PENDING_VERIFICATION: "Menunggu verifikasi",
  VERIFIED: "Terverifikasi",
  REJECTED: "Ditolak",
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-line bg-white p-6">
      <h2 className="mb-4 text-base font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [order, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: {
        items: { orderBy: { id: "asc" } },
        payments: {
          orderBy: { paidAt: "desc" },
          include: { verifiedBy: { select: { name: true } } },
        },
        history: {
          orderBy: { createdAt: "desc" },
          include: { changedBy: { select: { name: true } } },
        },
      },
    }),
    getStoreSettings(),
  ]);
  if (!order) notFound();

  const remaining = order.total - order.paidAmount;
  const waUrl = buildWhatsAppUrl(
    order.customerWhatsapp,
    `Halo ${order.customerName}, kami dari ${settings.storeName} terkait pesanan ${order.orderNumber}.`
  );

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb
          items={[
            { label: "Pesanan", href: "/admin/orders" },
            { label: order.orderNumber },
          ]}
        />
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold">{order.orderNumber}</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Dibuat {formatTanggalWaktu(order.createdAt)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.paymentStatus} dpPercentage={order.dpPercentage} />
              <FulfillmentBadge status={order.fulfillmentStatus} />
            </div>
          </div>
          <Link
            href={`/admin/orders/${order.id}/print`}
            target="_blank"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-stone-300 px-5 text-sm font-semibold hover:border-ink"
          >
            <Printer className="size-4" aria-hidden />
            Cetak ringkasan
          </Link>
        </div>
      </div>

      {order.status === "CANCELLED" && order.cancelReason && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="font-semibold">Alasan pembatalan: </span>
          {order.cancelReason}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card title="Item pesanan">
            <ul className="divide-y divide-stone-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-mist">
                    <Image
                      src={item.imageUrl ?? "/placeholder-shoe.svg"}
                      alt={item.productName}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      {item.brandName} · {item.productSku}
                    </p>
                    <p className="font-semibold">{item.productName}</p>
                    <p className="text-neutral-600">
                      Ukuran {item.size} x {item.quantity} @ {formatRupiah(item.unitPrice)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold">{formatRupiah(item.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-stone-line pt-3 text-xs text-neutral-500">
              Harga di atas adalah harga saat pesanan dibuat dan tidak berubah
              walau harga produk diubah kemudian.
            </p>
          </Card>

          <PaymentPanel
            orderId={order.id}
            orderStatus={order.status}
            total={order.total}
            dpAmount={order.dpAmount}
            dpPercentage={order.dpPercentage}
            paidAmount={order.paidAmount}
            payments={order.payments.map((p) => ({
              id: p.id,
              kind: p.kind,
              amount: p.amount,
              method: p.method,
              methodLabel: p.methodLabel,
              status: p.status,
              paidAt: p.paidAt.toISOString(),
              verifiedByName: p.verifiedBy?.name ?? null,
              note: p.note,
            }))}
          />

          <Card title="Riwayat status">
            <ol className="space-y-4">
              {order.history.map((h) => {
                const labels = VALUE_LABEL[h.kind] ?? {};
                return (
                  <li key={h.id} className="border-l-2 border-stone-300 pl-4 text-sm">
                    <p className="font-semibold">
                      {KIND_LABEL[h.kind] ?? h.kind}:{" "}
                      {h.fromValue ? `${labels[h.fromValue] ?? h.fromValue} → ` : ""}
                      {labels[h.toValue] ?? h.toValue}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {formatTanggalWaktu(h.createdAt)} ·{" "}
                      {h.changedBy?.name ?? "Sistem / pelanggan"}
                    </p>
                    {h.note && (
                      <p className="mt-1 text-neutral-700">
                        {h.note}
                        {h.visibleToCustomer && (
                          <span className="ml-2 text-xs text-neutral-400">
                            (terlihat pelanggan)
                          </span>
                        )}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Tindakan">
            <OrderActions
              orderId={order.id}
              status={order.status}
              paymentStatus={order.paymentStatus}
              paidAmount={order.paidAmount}
            />
          </Card>

          <Card title="Pelanggan">
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-neutral-500">Nama</dt>
                <dd className="font-semibold">{order.customerName}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">WhatsApp</dt>
                <dd className="font-semibold">{order.customerWhatsapp}</dd>
              </div>
              {order.note && (
                <div>
                  <dt className="text-xs text-neutral-500">Catatan dari pelanggan</dt>
                  <dd className="whitespace-pre-line">{order.note}</dd>
                </div>
              )}
            </dl>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex h-11 items-center justify-center gap-2 rounded-full border border-ink text-sm font-semibold transition hover:bg-ink hover:text-paper"
            >
              <MessageCircle className="size-4" aria-hidden />
              Chat pelanggan di WhatsApp
            </a>
          </Card>

          <Card title="Pengambilan di toko">
            <p className="text-sm text-neutral-700">
              Pesanan diambil langsung di toko.
            </p>
            {settings.address && (
              <p className="mt-2 text-sm text-neutral-600">{settings.address}</p>
            )}
          </Card>

          <Card title="Tautan pesanan pelanggan">
            <OrderAccessLink
              orderId={order.id}
              orderNumber={order.orderNumber}
              customerName={order.customerName}
              customerWhatsapp={order.customerWhatsapp}
              storeName={settings.storeName}
            />
          </Card>

          <Card title="Catatan">
            <OrderNotesForm
              orderId={order.id}
              customerNote={order.customerNote ?? ""}
              adminNote={order.adminNote ?? ""}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}