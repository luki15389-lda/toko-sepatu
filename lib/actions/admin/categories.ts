"use server";

import { revalidatePath, updateTag } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireAdminAction } from "@/lib/auth/session";
import { logActivity } from "@/lib/admin/activity";
import { slugify } from "@/lib/slug";
import {
  taxonomySchema,
  type TaxonomyFormValues,
} from "@/lib/validations/taxonomy";
import { fail, succeed, type ActionResult } from "@/lib/actions/admin/types";

function refresh() {
  updateTag("categories");
  updateTag("products");
  revalidatePath("/admin/categories");
}

export async function saveCategory(
  id: string | null,
  values: TaxonomyFormValues
): Promise<ActionResult> {
  const admin = await requireAdminAction();

  const parsed = taxonomySchema.safeParse(values);
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return fail("Periksa kembali isian Anda.", {
      name: flat.name?.[0],
      slug: flat.slug?.[0],
      description: flat.description?.[0],
    });
  }

  const name = parsed.data.name;
  const slug = parsed.data.slug || slugify(name);
  if (!slug) {
    return fail("Slug tidak valid.", {
      slug: "Isi slug secara manual (huruf kecil, angka, tanda hubung).",
    });
  }

  // Pemeriksaan duplikat dengan pesan yang jelas per kolom
  const duplicate = await prisma.category.findFirst({
    where: {
      ...(id ? { NOT: { id } } : {}),
      OR: [{ slug }, { name: { equals: name, mode: "insensitive" } }],
    },
    select: { slug: true },
  });
  if (duplicate) {
    return duplicate.slug === slug
      ? fail("Slug sudah dipakai.", { slug: "Slug sudah dipakai kategori lain." })
      : fail("Nama sudah dipakai.", { name: "Nama kategori sudah ada." });
  }

  const data = {
    name,
    slug,
    description: parsed.data.description || null,
    isActive: parsed.data.isActive,
  };

  try {
    await prisma.$transaction(async (tx) => {
      const saved = id
        ? await tx.category.update({ where: { id }, data })
        : await tx.category.create({ data });

      await logActivity(tx, {
        adminId: admin.id,
        action: id ? "category.update" : "category.create",
        entityType: "Category",
        entityId: saved.id,
        metadata: { name: saved.name, slug: saved.slug },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") return fail("Nama atau slug sudah dipakai.");
      if (error.code === "P2025") return fail("Kategori tidak ditemukan.");
    }
    throw error;
  }

  refresh();
  return succeed(id ? "Kategori diperbarui." : "Kategori ditambahkan.");
}

export async function setCategoryActive(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  const admin = await requireAdminAction();

  try {
    await prisma.$transaction(async (tx) => {
      const saved = await tx.category.update({
        where: { id },
        data: { isActive },
      });
      await logActivity(tx, {
        adminId: admin.id,
        action: isActive ? "category.activate" : "category.deactivate",
        entityType: "Category",
        entityId: saved.id,
        metadata: { name: saved.name },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return fail("Kategori tidak ditemukan.");
    }
    throw error;
  }

  refresh();
  return succeed(isActive ? "Kategori diaktifkan." : "Kategori dinonaktifkan.");
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const admin = await requireAdminAction();

  const inUse = await prisma.product.count({ where: { categoryId: id } });
  if (inUse > 0) {
    return fail(
      `Kategori masih dipakai ${inUse} produk. Nonaktifkan saja, atau pindahkan produknya ke kategori lain terlebih dahulu.`
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      const removed = await tx.category.delete({ where: { id } });
      await logActivity(tx, {
        adminId: admin.id,
        action: "category.delete",
        entityType: "Category",
        entityId: removed.id,
        metadata: { name: removed.name, slug: removed.slug },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Produk baru saja memakai kategori ini: relasi Restrict menolak penghapusan
      if (error.code === "P2003") {
        return fail("Kategori masih dipakai produk, sehingga tidak bisa dihapus.");
      }
      if (error.code === "P2025") return fail("Kategori tidak ditemukan.");
    }
    throw error;
  }

  refresh();
  return succeed("Kategori dihapus.");
}