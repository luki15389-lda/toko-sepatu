import { z } from "zod";

export const ADJUST_KINDS = ["RESTOCK", "ADD", "SUBTRACT"] as const;

export const ADJUST_KIND_LABEL: Record<(typeof ADJUST_KINDS)[number], string> = {
  RESTOCK: "Barang masuk (tambah stok)",
  ADD: "Koreksi: tambah stok",
  SUBTRACT: "Koreksi: kurangi stok",
};

export const stockAdjustSchema = z
  .object({
    kind: z.enum(ADJUST_KINDS),
    quantity: z
      .number({ error: "Jumlah wajib diisi." })
      .int("Jumlah harus bilangan bulat.")
      .min(1, "Jumlah minimal 1.")
      .max(100000, "Jumlah terlalu besar."),
    note: z.string().trim().max(200, "Catatan maksimal 200 karakter."),
  })
  .refine((v) => v.kind === "RESTOCK" || v.note.length >= 3, {
    path: ["note"],
    message: "Alasan koreksi wajib diisi (minimal 3 karakter).",
  });

export type StockAdjustInput = z.input<typeof stockAdjustSchema>;