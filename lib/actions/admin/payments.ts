"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/auth/session";
import {
  PaymentError,
  recordPaymentService,
  recordRefundService,
  verifyPaymentService,
} from "@/lib/orders/payments";
import {
  decisionSchema,
  paymentSchema,
  refundSchema,
  type PaymentInput,
  type RefundInput,
} from "@/lib/validations/payment";
import { fail, succeed, type ActionResult } from "@/lib/actions/admin/types";

function refresh(orderId?: string) {
  revalidatePath("/admin/payments");
  revalidatePath("/admin/orders");
  if (orderId) revalidatePath(`/admin/orders/${orderId}`);
}

export async function recordPayment(
  orderId: string,
  values: PaymentInput
): Promise<ActionResult> {
  const admin = await requireAdminAction();

  const parsed = paymentSchema.safeParse(values);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Data pembayaran tidak valid.");
  }

  try {
    await recordPaymentService({ orderId, adminId: admin.id, ...parsed.data });
  } catch (error) {
    if (error instanceof PaymentError) return fail(error.message);
    throw error;
  }

  refresh(orderId);
  return succeed(
    parsed.data.verifyNow
      ? "Pembayaran dicatat dan diverifikasi."
      : "Pembayaran dicatat, menunggu verifikasi."
  );
}

export async function recordRefund(
  orderId: string,
  values: RefundInput
): Promise<ActionResult> {
  const admin = await requireAdminAction();

  const parsed = refundSchema.safeParse(values);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Data pengembalian tidak valid.");
  }

  try {
    await recordRefundService({ orderId, adminId: admin.id, ...parsed.data });
  } catch (error) {
    if (error instanceof PaymentError) return fail(error.message);
    throw error;
  }

  refresh(orderId);
  return succeed("Pengembalian dana dicatat.");
}

export async function decidePayment(
  paymentId: string,
  decision: "verify" | "reject",
  note: string
): Promise<ActionResult> {
  const admin = await requireAdminAction();

  const parsed = decisionSchema.safeParse({ decision, note });
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  try {
    const { orderId } = await verifyPaymentService({
      paymentId,
      adminId: admin.id,
      decision: parsed.data.decision,
      note: parsed.data.note,
    });
    refresh(orderId);
  } catch (error) {
    if (error instanceof PaymentError) return fail(error.message);
    throw error;
  }

  return succeed(
    parsed.data.decision === "verify" ? "Pembayaran diverifikasi." : "Pembayaran ditolak."
  );
}