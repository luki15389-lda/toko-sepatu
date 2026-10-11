import { z } from "zod";
import { ORDER_STATUSES } from "@/lib/orders/status-flow";

export const statusChangeSchema = z.object({
  toStatus: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(300, "Catatan maksimal 300 karakter."),
});

export const cancelSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, "Alasan minimal 5 karakter.")
    .max(300, "Alasan maksimal 300 karakter."),
});

export const notesSchema = z.object({
  customerNote: z.string().trim().max(500, "Catatan pelanggan maksimal 500 karakter."),
  adminNote: z.string().trim().max(1000, "Catatan internal maksimal 1000 karakter."),
});