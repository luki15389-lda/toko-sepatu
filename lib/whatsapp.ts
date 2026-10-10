import { formatRupiah } from "@/lib/utils";

/**
 * Ubah nomor ke format internasional tanpa +, spasi, atau tanda hubung.
 * Contoh: "0812-3456-7890" -> "6281234567890"
 */
export function normalizeWhatsAppNumber(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  return digits;
}

/** Tautan WhatsApp Click to Chat. Pesan hanya terisi otomatis, tidak terkirim otomatis. */
export function buildWhatsAppUrl(number: string, message?: string): string {
  const normalized = normalizeWhatsAppNumber(number);
  const base = `https://wa.me/${normalized}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Pesan konfirmasi pesanan yang disiapkan untuk dikirim pelanggan ke penjual. */
export function buildOrderWhatsAppMessage(order: {
  storeName: string;
  orderNumber: string;
  customerName: string;
  total: number;
  items: { productName: string; size: string; quantity: number; lineTotal: number }[];
}): string {
  const lines = [
    `Halo ${order.storeName}, saya ingin mengonfirmasi pesanan berikut:`,
    "",
    `No. Pesanan: ${order.orderNumber}`,
    `Nama: ${order.customerName}`,
    "",
    "Daftar produk:",
    ...order.items.map(
      (it, i) =>
        `${i + 1}. ${it.productName} | Ukuran ${it.size} | ${it.quantity}x | ${formatRupiah(it.lineTotal)}`
    ),
    "",
    `Total: ${formatRupiah(order.total)}`,
    "Pengambilan: langsung di toko",
    "",
    "Mohon konfirmasi ketersediaan barang dan pembayarannya. Terima kasih.",
  ];
  return lines.join("\n");
}