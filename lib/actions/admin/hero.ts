"use server";

import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireAdminAction } from "@/lib/auth/session";
import { logActivity } from "@/lib/admin/activity";
import { MAX_HERO_IMAGES } from "@/lib/hero";
import { deleteImages, isAllowedImageUrl } from "@/lib/storage";
import { fail, succeed, type ActionResult } from "@/lib/actions/admin/types";

export async function setHeroImages(urls: string[]): Promise<ActionResult> {
  const admin = await requireAdminAction();

  if (!Array.isArray(urls)) return fail("Data tidak valid.");
  const unique = [...new Set(urls)];

  if (unique.length > MAX_HERO_IMAGES) {
    return fail(`Maksimal ${MAX_HERO_IMAGES} foto.`);
  }
  if (
    unique.some(
      (u) => typeof u !== "string" || u.length > 500 || !isAllowedImageUrl(u)
    )
  ) {
    return fail("Ada foto dengan alamat yang tidak diizinkan. Unggah ulang fotonya.");
  }

  const current = await prisma.storeSetting.findUnique({
    where: { id: "main" },
    select: { heroImages: true },
  });
  const previous = current?.heroImages ?? [];

  await prisma.$transaction(async (tx) => {
    await tx.storeSetting.upsert({
      where: { id: "main" },
      update: { heroImages: unique },
      create: { id: "main", heroImages: unique },
    });
    await logActivity(tx, {
      adminId: admin.id,
      action: "settings.hero_images",
      entityType: "StoreSetting",
      entityId: "main",
      metadata: { jumlahFoto: unique.length },
    });
  });

  // Hapus file foto yang tidak dipakai lagi
  const removed = previous.filter((u) => !unique.includes(u));
  if (removed.length > 0) await deleteImages(removed);

  updateTag("settings");
  revalidatePath("/admin/settings");
  return succeed("Foto hero disimpan.");
}