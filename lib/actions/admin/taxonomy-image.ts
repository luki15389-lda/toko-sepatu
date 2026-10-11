"use server";

import { revalidatePath, updateTag } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireAdminAction } from "@/lib/auth/session";
import { logActivity } from "@/lib/admin/activity";
import { deleteImages, isAllowedImageUrl } from "@/lib/storage";
import { fail, succeed, type ActionResult } from "@/lib/actions/admin/types";

function urlProblem(url: string | null): string | null {
  if (url !== null && (url.length > 500 || !isAllowedImageUrl(url))) {
    return "Alamat foto tidak diizinkan. Unggah ulang fotonya.";
  }
  return null;
}

export async function setCategoryImage(
  id: string,
  url: string | null
): Promise<ActionResult> {
  const admin = await requireAdminAction();

  const problem = urlProblem(url);
  if (problem) return fail(problem);

  const previous = await prisma.category.findUnique({
    where: { id },
    select: { name: true, imageUrl: true },
  });
  if (!previous) return fail("Kategori tidak ditemukan.");

  await prisma.$transaction(async (tx) => {
    await tx.category.update({ where: { id }, data: { imageUrl: url } });
    await logActivity(tx, {
      adminId: admin.id,
      action: "category.update",
      entityType: "Category",
      entityId: id,
      metadata: { name: previous.name, foto: url ? "diubah" : "dihapus" },
    });
  });

  if (previous.imageUrl && previous.imageUrl !== url) {
    await deleteImages([previous.imageUrl]);
  }

  updateTag("categories");
  revalidatePath("/admin/categories");
  return succeed(url ? "Foto kategori disimpan." : "Foto kategori dihapus.");
}