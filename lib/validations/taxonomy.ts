import { z } from "zod";

export const taxonomySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(60, "Nama maksimal 60 karakter."),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(80, "Slug maksimal 80 karakter.")
    .regex(
      /^(?:[a-z0-9]+(?:-[a-z0-9]+)*)?$/,
      "Slug hanya boleh huruf kecil, angka, dan tanda hubung."
    ),
  description: z.string().trim().max(500, "Deskripsi maksimal 500 karakter."),
  isActive: z.boolean(),
});

export type TaxonomyFormValues = z.infer<typeof taxonomySchema>;