import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db/prisma";

// Hanya kolom yang aman ditampilkan ke publik.
// `paymentInstructions` (info rekening) SENGAJA tidak ikut.
const publicSettingSelect = {
  storeName: true,
  tagline: true,
  description: true,
  logoUrl: true,
  whatsappNumber: true,
  email: true,
  address: true,
  mapUrl: true,
  openingHours: true,
  pickupInstructions: true,
  dpPercentage: true,
  lowStockThreshold: true,
  announcementText: true,
  promoBannerTitle: true,
  promoBannerText: true,
  promoBannerImageUrl: true,
  heroImages: true,
  footerText: true,
  instagramUrl: true,
  facebookUrl: true,
  tiktokUrl: true,
} as const;

export type PublicStoreSettings = {
  storeName: string;
  tagline: string | null;
  description: string | null;
  logoUrl: string | null;
  whatsappNumber: string;
  email: string | null;
  address: string | null;
  mapUrl: string | null;
  openingHours: string | null;
  pickupInstructions: string | null;
  dpPercentage: number;
  lowStockThreshold: number;
  announcementText: string | null;
  promoBannerTitle: string | null;
  promoBannerText: string | null;
  promoBannerImageUrl: string | null;
  heroImages: string[];
  footerText: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
};

const FALLBACK: PublicStoreSettings = {
  storeName: "SOLESPACE",
  tagline: null,
  description: null,
  logoUrl: null,
  whatsappNumber: "",
  email: null,
  address: null,
  mapUrl: null,
  openingHours: null,
  pickupInstructions: null,
  dpPercentage: 50,
  lowStockThreshold: 5,
  announcementText: null,
  promoBannerTitle: null,
  promoBannerText: null,
  promoBannerImageUrl: null,
  heroImages: [],
  footerText: null,
  instagramUrl: null,
  facebookUrl: null,
  tiktokUrl: null,
};

export async function getStoreSettings(): Promise<PublicStoreSettings> {
  "use cache";
  cacheLife("hours");
  cacheTag("settings");

  const row = await prisma.storeSetting.findUnique({
    where: { id: "main" },
    select: publicSettingSelect,
  });

  return row ?? FALLBACK;
}