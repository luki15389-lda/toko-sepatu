"use server";

import { revalidatePath, updateTag } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireAdminAction } from "@/lib/auth/session";
import { logActivity } from "@/lib/admin/activity";
import { slugify } from "@/lib/slug";
import { deleteImages, isAllowedImageUrl } from "@/lib/storage";
import { productSchema, type ProductFormValues } from "@/lib/validations/product";
import { fail, succeed, type ActionResult } from "@/lib/actions/admin/types";

class ActionFailure extends Error {}

function refresh() {
  updateTag("products");
  revalidatePath("/admin/products");
}

export async function saveProduct(
  productId: string | null,
  values: ProductFormValues
): Promise<ActionResult> {
  const admin = await requireAdminAction();

  const parsed = productSchema.safeParse(values);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Data produk tidak valid.");
  }
  const data = parsed.data;

  if (data.images.some((img) => !isAllowedImageUrl(img.url))) {
    return fail("Ada foto dengan alamat yang tidak diizinkan. Unggah ulang fotonya.");
  }

  const [brand, category] = await Promise.all([
    prisma.brand.findUnique({ where: { id: data.brandId }, select: { id: true } }),
    prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true } }),
  ]);
  if (!brand) return fail("Merek tidak ditemukan.", { brandId: "Pilih merek yang valid." });
  if (!category) {
    return fail("Kategori tidak ditemukan.", { categoryId: "Pilih kategori yang valid." });
  }

  const slug = data.slug || slugify(data.name);
  if (!slug) {
    return fail("Slug tidak valid.", { slug: "Isi slug secara manual." });
  }

  const clash = await prisma.product.findFirst({
    where: {
      ...(productId ? { NOT: { id: productId } } : {}),
      OR: [{ slug }, { sku: data.sku }],
    },
    select: { slug: true },
  });
  if (clash) {
    return clash.slug === slug
      ? fail("Slug sudah dipakai.", { slug: "Slug sudah dipakai produk lain." })
      : fail("SKU sudah dipakai.", { sku: "SKU sudah dipakai produk lain." });
  }

  // SKU varian: otomatis dari SKU produk + ukuran jika dikosongkan
  const variants = data.variants.map((v) => ({
    ...v,
    sku:
      v.sku ||
      `${data.sku}-${v.size.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}`,
  }));

  const skuSeen = new Set<string>();
  for (const [index, v] of variants.entries()) {
    if (skuSeen.has(v.sku)) {
      return fail("SKU ukuran ada yang kembar.", {
        [`variants.${index}.sku`]: "SKU ukuran ini kembar.",
      });
    }
    skuSeen.add(v.sku);
  }

  const keptIds = variants
    .map((v) => v.variantId)
    .filter((id): id is string => Boolean(id));
  const variantClash = await prisma.productVariant.findFirst({
    where: {
      sku: { in: variants.map((v) => v.sku) },
      ...(keptIds.length > 0 ? { id: { notIn: keptIds } } : {}),
    },
    select: { sku: true },
  });
  if (variantClash) {
    const index = variants.findIndex((v) => v.sku === variantClash.sku);
    return fail(`SKU ukuran ${variantClash.sku} sudah dipakai produk lain.`, {
      [`variants.${index}.sku`]: "SKU ini sudah dipakai.",
    });
  }

  const fields = {
    name: data.name,
    slug,
    sku: data.sku,
    brandId: data.brandId,
    categoryId: data.categoryId,
    description: data.description,
    material: data.material || null,
    specifications: data.specifications || null,
    price: data.price,
    discountPrice: data.discountPrice,
    isPublished: data.isPublished,
    isFeatured: data.isFeatured,
  };

  const imageRows = (id: string) =>
    data.images.map((img, index) => ({
      productId: id,
      url: img.url,
      alt: img.alt || null,
      sortOrder: index,
      isPrimary: index === 0,
    }));

  let removedImages: string[] = [];

  try {
    await prisma.$transaction(async (tx) => {
      if (!productId) {
        // ---------- BUAT BARU ----------
        const created = await tx.product.create({
          data: {
            ...fields,
            variants: {
              create: variants.map((v) => ({
                size: v.size,
                sku: v.sku,
                stock: v.stock,
                isAvailable: v.isAvailable,
              })),
            },
          },
          select: { id: true, variants: { select: { id: true, stock: true } } },
        });

        if (data.images.length > 0) {
          await tx.productImage.createMany({ data: imageRows(created.id) });
        }

        await tx.inventoryMovement.createMany({
          data: created.variants
            .filter((v) => v.stock > 0)
            .map((v): Prisma.InventoryMovementCreateManyInput => ({
              variantId: v.id,
              type: "INITIAL",
              quantityChange: v.stock,
              stockBefore: 0,
              stockAfter: v.stock,
              note: "Stok awal",
              createdById: admin.id,
            })),
        });

        await logActivity(tx, {
          adminId: admin.id,
          action: "product.create",
          entityType: "Product",
          entityId: created.id,
          metadata: { name: data.name, sku: data.sku },
        });
        return;
      }

      // ---------- UBAH ----------
      const current = await tx.product.findUnique({
        where: { id: productId },
        select: {
          images: { select: { url: true } },
          variants: {
            select: {
              id: true,
              size: true,
              _count: { select: { orderItems: true } },
            },
          },
        },
      });
      if (!current) throw new ActionFailure("Produk tidak ditemukan.");

      const currentIds = new Set(current.variants.map((v) => v.id));
      if (keptIds.some((id) => !currentIds.has(id))) {
        throw new ActionFailure("Data ukuran tidak cocok. Muat ulang halaman.");
      }

      await tx.product.update({ where: { id: productId }, data: fields });

      // Foto: ganti seluruh daftar, lalu catat file lama yang tidak dipakai lagi
      await tx.productImage.deleteMany({ where: { productId } });
      if (data.images.length > 0) {
        await tx.productImage.createMany({ data: imageRows(productId) });
      }
      const newUrls = new Set(data.images.map((i) => i.url));
      removedImages = current.images
        .map((i) => i.url)
        .filter((url) => !newUrls.has(url));

      // Ukuran yang dihapus dari form
      const kept = new Set(keptIds);
      for (const old of current.variants) {
        if (kept.has(old.id)) continue;
        if (old._count.orderItems > 0) {
          throw new ActionFailure(
            `Ukuran ${old.size} sudah pernah dipesan, jadi tidak bisa dihapus. Tandai tidak tersedia saja.`
          );
        }
        await tx.inventoryMovement.deleteMany({ where: { variantId: old.id } });
        await tx.productVariant.delete({ where: { id: old.id } });
      }

      // Ukuran yang diubah atau ditambah. Stok ukuran lama TIDAK diubah di sini.
      for (const v of variants) {
        if (v.variantId) {
          await tx.productVariant.update({
            where: { id: v.variantId },
            data: { size: v.size, sku: v.sku, isAvailable: v.isAvailable },
          });
        } else {
          const created = await tx.productVariant.create({
            data: {
              productId,
              size: v.size,
              sku: v.sku,
              stock: v.stock,
              isAvailable: v.isAvailable,
            },
            select: { id: true },
          });
          if (v.stock > 0) {
            await tx.inventoryMovement.create({
              data: {
                variantId: created.id,
                type: "INITIAL",
                quantityChange: v.stock,
                stockBefore: 0,
                stockAfter: v.stock,
                note: "Stok awal",
                createdById: admin.id,
              },
            });
          }
        }
      }

      await logActivity(tx, {
        adminId: admin.id,
        action: "product.update",
        entityType: "Product",
        entityId: productId,
        metadata: { name: data.name, sku: data.sku },
      });
    });
  } catch (error) {
    if (error instanceof ActionFailure) return fail(error.message);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return fail("Slug, SKU, atau ukuran bentrok dengan data lain. Periksa kembali.");
      }
      if (error.code === "P2025") return fail("Produk tidak ditemukan.");
    }
    throw error;
  }

  await deleteImages(removedImages);
  refresh();
  return succeed(productId ? "Produk diperbarui." : "Produk ditambahkan.");
}

export async function setProductArchived(
  id: string,
  archived: boolean
): Promise<ActionResult> {
  const admin = await requireAdminAction();

  try {
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id },
        data: { archivedAt: archived ? new Date() : null },
        select: { id: true, name: true },
      });
      await logActivity(tx, {
        adminId: admin.id,
        action: archived ? "product.archive" : "product.restore",
        entityType: "Product",
        entityId: product.id,
        metadata: { name: product.name },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return fail("Produk tidak ditemukan.");
    }
    throw error;
  }

  refresh();
  return succeed(archived ? "Produk diarsipkan." : "Produk dipulihkan.");
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const admin = await requireAdminAction();

  const ordered = await prisma.orderItem.count({ where: { productId: id } });
  if (ordered > 0) {
    return fail(
      `Produk ini ada di ${ordered} item pesanan, jadi tidak bisa dihapus agar riwayat transaksi tetap utuh. Arsipkan saja.`
    );
  }

  let imageUrls: string[] = [];

  try {
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          sku: true,
          images: { select: { url: true } },
        },
      });
      if (!product) throw new ActionFailure("Produk tidak ditemukan.");

      await tx.inventoryMovement.deleteMany({ where: { variant: { productId: id } } });
      await tx.product.delete({ where: { id } }); // foto dan ukuran ikut terhapus

      await logActivity(tx, {
        adminId: admin.id,
        action: "product.delete",
        entityType: "Product",
        entityId: product.id,
        metadata: { name: product.name, sku: product.sku },
      });
      imageUrls = product.images.map((i) => i.url);
    });
  } catch (error) {
    if (error instanceof ActionFailure) return fail(error.message);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Baru saja ada pesanan yang memakai produk ini
      if (error.code === "P2003") {
        return fail("Produk baru saja dipesan, sehingga tidak bisa dihapus. Arsipkan saja.");
      }
      if (error.code === "P2025") return fail("Produk tidak ditemukan.");
    }
    throw error;
  }

  await deleteImages(imageUrls);
  refresh();
  return succeed("Produk dihapus.");
}