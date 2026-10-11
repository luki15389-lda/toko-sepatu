import { z } from "zod";

export const PAYMENT_METHODS = ["BANK_TRANSFER", "CASH", "OTHER"] as const;

const baseShape = {
  amount: z
    .number({ error: "Nominal wajib diisi." })
    .int("Nominal harus bilangan bulat (Rupiah).")
    .min(1, "Nominal minimal Rp1.")
    .max(100_000_000, "Nominal terlalu besar."),
  method: z.enum(PAYMENT_METHODS, { error: "Pilih metode pembayaran." }),
  methodLabel: z.string().trim().max(50, "Nama metode maksimal 50 karakter."),
  paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid."),
  note: z.string().trim().max(300, "Catatan maksimal 300 karakter."),
};

const labelRule = (v: { method: string; methodLabel: string }) =>
  v.method !== "OTHER" || v.methodLabel !== "";
const labelIssue = { path: ["methodLabel"], message: "Isi nama metode pembayaran." };

export const paymentSchema = z
  .object({ ...baseShape, verifyNow: z.boolean() })
  .refine(labelRule, labelIssue);

export const refundSchema = z.object(baseShape).refine(labelRule, labelIssue);

export const decisionSchema = z.object({
  decision: z.enum(["verify", "reject"]),
  note: z.string().trim().max(300, "Catatan maksimal 300 karakter."),
});

export type PaymentInput = z.input<typeof paymentSchema>;
export type RefundInput = z.input<typeof refundSchema>;