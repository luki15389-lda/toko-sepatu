"use server";

import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireAdminAction } from "@/lib/auth/session";
import { logActivity } from "@/lib/admin/activity";
import {
  settingsSchema,
  type SettingsFormValues,
} from "@/lib/validations/settings";
import { fail, succeed, type ActionResult } from "@/lib/actions/admin/types";

const n = (v: string) => (v === "" ? null : v);

export async function saveSettings(values: SettingsFormValues): Promise<ActionResult> {
  const admin = await requireAdminAction();

  const parsed = settingsSchema.safeParse(values);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Pengaturan tidak valid.");
  }
  const d = parsed.data;

  const data = {
    storeName: d.storeName,
    tagline: n(d.tagline),
    description: n(d.description),
    whatsappNumber: d.whatsappNumber,
    email: n(d.email),
    address: n(d.address),
    mapUrl: n(d.mapUrl),
    openingHours: n(d.openingHours),
    pickupInstructions: n(d.pickupInstructions),
    dpPercentage: d.dpPercentage,
    lowStockThreshold: d.lowStockThreshold,
    paymentInstructions: n(d.paymentInstructions),
    announcementText: n(d.announcementText),
    promoBannerTitle: n(d.promoBannerTitle),
    promoBannerText: n(d.promoBannerText),
    footerText: n(d.footerText),
    instagramUrl: n(d.instagramUrl),
    facebookUrl: n(d.facebookUrl),
    tiktokUrl: n(d.tiktokUrl),
  };

  await prisma.$transaction(async (tx) => {
    await tx.storeSetting.upsert({
      where: { id: "main" },
      update: data,
      create: { id: "main", ...data },
    });
    await logActivity(tx, {
      adminId: admin.id,
      action: "settings.update",
      entityType: "StoreSetting",
      entityId: "main",
    });
  });

  updateTag("settings");
  revalidatePath("/admin/settings");
  return succeed("Pengaturan disimpan. Berlaku untuk pesanan baru.");
}