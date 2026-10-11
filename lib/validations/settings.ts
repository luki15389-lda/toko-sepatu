import { z } from "zod";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp";

const text = (max: number, label: string) =>
  z.string().trim().max(max, `${label} maksimal ${max} karakter.`);

const optionalUrl = z
  .string()
  .trim()
  .max(300, "Alamat tautan terlalu panjang.")
  .refine((v) => v === "" || /^https:\/\/\S+$/i.test(v), "Gunakan alamat yang diawali https://");

export const settingsSchema = z.object({
  storeName: z.string().trim().min(2, "Nama toko minimal 2 karakter.").max(60, "Nama toko maksimal 60 karakter."),
  tagline: text(150, "Tagline"),
  description: text(500, "Deskripsi"),
  whatsappNumber: z
    .string()
    .trim()
    .min(1, "Nomor WhatsApp wajib diisi.")
    .max(25, "Nomor terlalu panjang.")
    .transform(normalizeWhatsAppNumber)
    .refine((v) => /^62\d{8,13}$/.test(v), "Nomor tidak valid. Contoh: 081234567890"),
  email: z
    .string()
    .trim()
    .max(120, "Email terlalu panjang.")
    .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Format email tidak valid."),
  address: text(300, "Alamat"),
  mapUrl: optionalUrl,
  openingHours: text(300, "Jam operasional"),
  pickupInstructions: text(500, "Petunjuk pengambilan"),
  dpPercentage: z
    .number({ error: "Persentase DP wajib diisi." })
    .int("Persentase DP harus bilangan bulat.")
    .min(0, "Minimal 0.")
    .max(100, "Maksimal 100."),
  lowStockThreshold: z
    .number({ error: "Batas stok rendah wajib diisi." })
    .int("Harus bilangan bulat.")
    .min(0, "Minimal 0.")
    .max(1000, "Maksimal 1000."),
  paymentInstructions: text(1000, "Info pembayaran"),
  announcementText: text(200, "Teks pengumuman"),
  promoBannerTitle: text(100, "Judul banner"),
  promoBannerText: text(300, "Teks banner"),
  footerText: text(200, "Teks footer"),
  instagramUrl: optionalUrl,
  facebookUrl: optionalUrl,
  tiktokUrl: optionalUrl,
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;