import { getAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { parsePeriod, periodRange, wibDateTime } from "@/lib/admin/stats";
import { toCsv } from "@/lib/csv";
import {
  FULFILLMENT_STATUS_LABEL,
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
} from "@/lib/order-labels";

const MAX_ROWS = 10000;

export async function GET(request: Request) {
  const admin = await getAdmin();
  if (!admin || admin.role !== "ADMIN") {
    return new Response("Tidak diizinkan.", { status: 403 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const period = parsePeriod(
    url.searchParams.get("from") ?? undefined,
    url.searchParams.get("to") ?? undefined
  );

  let rows: (string | number | null)[][];
  let filename: string;

  if (type === "orders") {
    const orders = await prisma.order.findMany({
      where: { createdAt: periodRange(period) },
      orderBy: { createdAt: "desc" },
      take: MAX_ROWS,
      select: {
        orderNumber: true,
        createdAt: true,
        customerName: true,
        customerWhatsapp: true,
        total: true,
        paidAmount: true,
        status: true,
        paymentStatus: true,
        fulfillmentStatus: true,
      },
    });
    rows = [
      ["Nomor pesanan", "Tanggal (WIB)", "Pelanggan", "WhatsApp", "Total", "Terbayar", "Sisa tagihan", "Status pesanan", "Status pembayaran", "Status pengambilan"],
      ...orders.map((o) => [
        o.orderNumber,
        wibDateTime(o.createdAt),
        o.customerName,
        o.customerWhatsapp,
        o.total,
        o.paidAmount,
        o.total - o.paidAmount,
        ORDER_STATUS_LABEL[o.status] ?? o.status,
        PAYMENT_STATUS_LABEL[o.paymentStatus] ?? o.paymentStatus,
        FULFILLMENT_STATUS_LABEL[o.fulfillmentStatus] ?? o.fulfillmentStatus,
      ]),
    ];
    filename = `pesanan_${period.from}_${period.to}.csv`;
  } else if (type === "stock") {
    const variants = await prisma.productVariant.findMany({
      where: { product: { archivedAt: null } },
      orderBy: [{ product: { name: "asc" } }, { size: "asc" }],
      take: MAX_ROWS,
      select: {
        size: true,
        sku: true,
        stock: true,
        isAvailable: true,
        product: { select: { name: true, sku: true, brand: { select: { name: true } } } },
      },
    });
    rows = [
      ["Produk", "Merek", "SKU produk", "Ukuran", "SKU ukuran", "Stok", "Tersedia"],
      ...variants.map((v) => [
        v.product.name,
        v.product.brand.name,
        v.product.sku,
        v.size,
        v.sku,
        v.stock,
        v.isAvailable ? "Ya" : "Tidak",
      ]),
    ];
    filename = "stok.csv";
  } else {
    return new Response("Jenis laporan tidak dikenal.", { status: 400 });
  }

  return new Response("\uFEFF" + toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}