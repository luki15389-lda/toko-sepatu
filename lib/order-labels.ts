export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING_CONFIRMATION: "Menunggu Konfirmasi",
  CONFIRMED: "Dikonfirmasi",
  AWAITING_PAYMENT: "Menunggu Pembayaran",
  PROCESSING: "Sedang Diproses",
  READY_FOR_PICKUP: "Siap Diambil",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

export const ORDER_STATUS_HELP: Record<string, string> = {
  PENDING_CONFIRMATION:
    "Pesanan Anda sudah tercatat, tetapi belum dikonfirmasi penjual. Kirim pesan konfirmasi lewat WhatsApp.",
  CONFIRMED: "Penjual sudah mengonfirmasi pesanan Anda.",
  AWAITING_PAYMENT: "Pesanan menunggu pembayaran sesuai kesepakatan dengan penjual.",
  PROCESSING: "Pesanan Anda sedang disiapkan.",
  READY_FOR_PICKUP: "Pesanan sudah siap. Silakan ambil di toko.",
  COMPLETED: "Pesanan telah selesai dan barang sudah diserahkan.",
  CANCELLED: "Pesanan ini dibatalkan.",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  UNPAID: "Belum Dibayar",
  DP_PARTIAL: "DP Terverifikasi",
  PAID: "Lunas",
  REFUNDED: "Dikembalikan",
  PAYMENT_CANCELLED: "Pembayaran Dibatalkan",
};

export const FULFILLMENT_STATUS_LABEL: Record<string, string> = {
  NOT_READY: "Belum Siap",
  READY_FOR_PICKUP: "Siap Diambil",
  PICKED_UP: "Sudah Diambil",
  CANCELLED: "Dibatalkan",
};

export function paymentLabel(status: string, dpPercentage: number): string {
  if (status === "DP_PARTIAL") return `DP ${dpPercentage}% Terverifikasi`;
  return PAYMENT_STATUS_LABEL[status] ?? status;
}