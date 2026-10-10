import { z } from "zod";

export const MAX_PRODUCT_IMAGES = 8;

const SIZE_RE = /^[A-Za-z0-9.\-/]{1,10}$/;

const imageSchema = z.object({
  url: z.string().min(1).max(500),
  alt: z.string().trim().max(150, "Teks alternatif maksimal 150 karakter."),
});

const variantSchema = z.object({
  variantId: z.string().max(40).nullable(),
  size: z
    .string()
    .trim()
    .min(1, "Ukuran wajib diisi.")
    .max(10, "Ukuran maksimal 10 karakter.")
    .regex(SIZE_RE, "Hanya huruf, angka, titik, atau tanda hubung."),
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .max(50, "SKU maksimal 50 karakter.")
    .regex(/^(?:[A-Z0-9][A-Z0-9-]*)?$/, "Hanya huruf besar, angka, dan tanda hubung."),
  stock: z
    .number({ error: "Stok wajib diisi." })
    .int("Stok harus bilangan bulat.")
    .min(0, "Stok tidak boleh negatif.")
    .max(100000, "Stok terlalu besar."),
  isAvailable: z.boolean(),
});

export const productSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Nama minimal 2 karakter.")
      .max(120, "Nama maksimal 120 karakter."),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .max(100, "Slug maksimal 100 karakter.")
      .regex(
        /^(?:[a-z0-9]+(?:-[a-z0-9]+)*)?$/,
        "Slug hanya boleh huruf kecil, angka, dan tanda hubung."
      ),
    sku: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, "SKU minimal 3 karakter.")
      .max(40, "SKU maksimal 40 karakter.")
      .regex(/^[A-Z0-9][A-Z0-9-]*$/, "Hanya huruf besar, angka, dan tanda hubung."),
    brandId: z.string().min(1, "Pilih merek."),
    categoryId: z.string().min(1, "Pilih kategori."),
    description: z
      .string()
      .trim()
      .min(10, "Deskripsi minimal 10 karakter.")
      .max(5000, "Deskripsi maksimal 5000 karakter."),
    material: z.string().trim().max(200, "Bahan maksimal 200 karakter."),
    specifications: z
      .string()
      .trim()
      .max(2000, "Spesifikasi maksimal 2000 karakter."),
    price: z
      .number({ error: "Harga wajib diisi." })
      .int("Harga harus bilangan bulat (Rupiah).")
      .min(1000, "Harga minimal Rp1.000.")
      .max(100_000_000, "Harga terlalu besar."),
    discountPrice: z
      .number({ error: "Harga diskon tidak valid." })
      .int("Harga diskon harus bilangan bulat.")
      .min(1, "Harga diskon minimal Rp1.")
      .nullable(),
    isPublished: z.boolean(),
    isFeatured: z.boolean(),
    images: z.array(imageSchema).max(MAX_PRODUCT_IMAGES, `Maksimal ${MAX_PRODUCT_IMAGES} foto.`),
    variants: z
      .array(variantSchema)
      .min(1, "Tambahkan minimal satu ukuran.")
      .max(30, "Maksimal 30 ukuran."),
  })
  .superRefine((value, ctx) => {
    if (value.discountPrice !== null && value.discountPrice >= value.price) {
      ctx.addIssue({
        code: "custom",
        path: ["discountPrice"],
        message: "Harga diskon harus lebih murah dari harga normal.",
      });
    }

    const seen = new Set<string>();
    value.variants.forEach((variant, index) => {
      const key = variant.size.toLowerCase();
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["variants", index, "size"],
          message: "Ukuran ini sudah ada.",
        });
      }
      seen.add(key);
    });
  });

export type ProductFormValues = z.infer<typeof productSchema>;