import type { Metadata } from "next";
import { HeroImagesManager } from "@/components/admin/hero-images-manager";
import { SettingsForm } from "@/components/admin/settings-form";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = { title: "Pengaturan" };

export default async function AdminSettingsPage() {
  await requireAdmin();

  const s = await prisma.storeSetting.findUnique({ where: { id: "main" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Pengaturan toko</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Perubahan langsung tampil di website. Logo toko dan gambar banner
          promosi belum tersedia di versi ini.
        </p>
      </div>

      <HeroImagesManager initial={s?.heroImages ?? []} />

      <SettingsForm
        defaultValues={{
          storeName: s?.storeName ?? "SOLESPACE",
          tagline: s?.tagline ?? "",
          description: s?.description ?? "",
          whatsappNumber: s?.whatsappNumber ?? "",
          email: s?.email ?? "",
          address: s?.address ?? "",
          mapUrl: s?.mapUrl ?? "",
          openingHours: s?.openingHours ?? "",
          pickupInstructions: s?.pickupInstructions ?? "",
          dpPercentage: s?.dpPercentage ?? 50,
          lowStockThreshold: s?.lowStockThreshold ?? 5,
          paymentInstructions: s?.paymentInstructions ?? "",
          announcementText: s?.announcementText ?? "",
          promoBannerTitle: s?.promoBannerTitle ?? "",
          promoBannerText: s?.promoBannerText ?? "",
          footerText: s?.footerText ?? "",
          instagramUrl: s?.instagramUrl ?? "",
          facebookUrl: s?.facebookUrl ?? "",
          tiktokUrl: s?.tiktokUrl ?? "",
        }}
      />
    </div>
  );
}