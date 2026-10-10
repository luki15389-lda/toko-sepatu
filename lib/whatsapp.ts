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