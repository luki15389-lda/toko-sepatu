import { z } from "zod";
import { MAX_LINES, MAX_QTY_PER_LINE } from "@/lib/cart/constants";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp";

export const checkoutSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(80, "Nama maksimal 80 karakter."),
  whatsapp: z
    .string()
    .trim()
    .min(1, "Nomor WhatsApp wajib diisi.")
    .max(25, "Nomor WhatsApp terlalu panjang.")
    .transform(normalizeWhatsAppNumber)
    .refine(
      (v) => /^62\d{8,13}$/.test(v),
      "Nomor WhatsApp tidak valid. Contoh: 081234567890"
    ),
  note: z
    .string()
    .trim()
    .max(500, "Catatan maksimal 500 karakter.")
    .transform((v) => (v === "" ? null : v)),
  items: z
    .array(
      z.object({
        variantId: z.string().min(1).max(40),
        quantity: z.number().int().min(1).max(MAX_QTY_PER_LINE),
      })
    )
    .min(1, "Keranjang kosong.")
    .max(MAX_LINES, "Terlalu banyak jenis produk di keranjang."),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;