"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAdminAction } from "@/lib/auth/session";
import { logActivity } from "@/lib/admin/activity";
import { fail, succeed, type ActionResult } from "@/lib/actions/admin/types";

const pageSchema = z.object({
  title: z.string().trim().min(2, "Judul minimal 2 karakter.").max(100, "Judul maksimal 100 karakter."),
  content: z.string().trim().min(10, "Isi minimal 10 karakter.").max(10000, "Isi maksimal 10.000 karakter."),
  isPublished: z.boolean(),
});

export async function savePage(
  slug: string,
  values: { title: string; content: string; isPublished: boolean }
): Promise<ActionResult> {
  const admin = await requireAdminAction();

  const parsed = pageSchema.safeParse(values);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  const existing = await prisma.contentPage.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!existing) return fail("Halaman tidak ditemukan.");

  await prisma.$transaction(async (tx) => {
    await tx.contentPage.update({ where: { slug }, data: parsed.data });
    await logActivity(tx, {
      adminId: admin.id,
      action: "page.update",
      entityType: "ContentPage",
      entityId: existing.id,
      metadata: { slug, published: parsed.data.isPublished },
    });
  });

  updateTag("pages");
  revalidatePath("/admin/pages");
  return succeed("Halaman disimpan.");
}