export const ACTIVITY_LABEL: Record<string, string> = {
  "auth.login": "Masuk ke dashboard",
  "product.create": "Menambah produk",
  "product.update": "Mengubah produk",
  "product.archive": "Mengarsipkan produk",
  "product.restore": "Memulihkan produk",
  "product.delete": "Menghapus produk",
  "category.create": "Menambah kategori",
  "category.update": "Mengubah kategori",
  "category.activate": "Mengaktifkan kategori",
  "category.deactivate": "Menonaktifkan kategori",
  "category.delete": "Menghapus kategori",
  "brand.create": "Menambah merek",
  "brand.update": "Mengubah merek",
  "brand.activate": "Mengaktifkan merek",
  "brand.deactivate": "Menonaktifkan merek",
  "brand.delete": "Menghapus merek",
  "order.status_change": "Mengubah status pesanan",
  "order.cancel": "Membatalkan pesanan",
  "order.notes_update": "Mengubah catatan pesanan",
  "order.access_link": "Membuat tautan akses pesanan",
  "payment.record_verified": "Mencatat pembayaran (terverifikasi)",
  "payment.record_pending": "Mencatat pembayaran (menunggu verifikasi)",
  "payment.verify": "Memverifikasi pembayaran",
  "payment.reject": "Menolak pembayaran",
  "payment.refund": "Mencatat pengembalian dana",
  "stock.adjust": "Mengubah stok",
  "settings.update": "Mengubah pengaturan toko",
  "page.update": "Mengubah halaman informasi",
};

export const ACTIVITY_GROUPS = [
  { value: "", label: "Semua aktivitas" },
  { value: "auth", label: "Login" },
  { value: "product", label: "Produk" },
  { value: "category", label: "Kategori" },
  { value: "brand", label: "Merek" },
  { value: "order", label: "Pesanan" },
  { value: "payment", label: "Pembayaran" },
  { value: "stock", label: "Stok" },
  { value: "settings", label: "Pengaturan" },
  { value: "page", label: "Halaman" },
] as const;

export function summarizeMetadata(meta: unknown): string {
  if (!meta || typeof meta !== "object") return "";
  const text = Object.entries(meta as Record<string, unknown>)
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
    .join(" · ");
  return text.length > 140 ? `${text.slice(0, 137)}...` : text;
}