"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { Modal } from "@/components/admin/modal";
import { cancelOrder, changeOrderStatus } from "@/lib/actions/admin/orders";
import { ORDER_STATUS_LABEL } from "@/lib/order-labels";
import {
  NEXT_STATUSES,
  STATUS_ACTION_LABEL,
  isOrderStatus,
  type OrderStatusValue,
} from "@/lib/orders/status-flow";
import { formatRupiah } from "@/lib/utils";

const textareaClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10";

export function OrderActions({
  orderId,
  status,
  paymentStatus,
  paidAmount,
}: {
  orderId: string;
  status: string;
  paymentStatus: string;
  paidAmount: number;
}) {
  const [target, setTarget] = useState<OrderStatusValue | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  const nextSteps = (isOrderStatus(status) ? NEXT_STATUSES[status] : []).filter(
    (s) => s !== "CANCELLED"
  );
  const canCancel = isOrderStatus(status) && NEXT_STATUSES[status].includes("CANCELLED");

  function openStatus(next: OrderStatusValue) {
    setNote("");
    setTarget(next);
  }

  function submitStatus() {
    if (!target) return;
    startTransition(async () => {
      const result = await changeOrderStatus(orderId, target, note);
      if (result.ok) {
        toast.success(result.message);
        setTarget(null);
      } else {
        toast.error(result.message);
      }
    });
  }

  function submitCancel() {
    startTransition(async () => {
      const result = await cancelOrder(orderId, reason);
      if (result.ok) {
        toast.success(result.message);
        setCancelling(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  if (nextSteps.length === 0 && !canCancel) {
    return (
      <p className="text-sm text-neutral-600">
        Pesanan ini sudah ditutup. Statusnya tidak bisa diubah lagi.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {nextSteps.map((next, index) => {
        const blocked = next === "COMPLETED" && paymentStatus !== "PAID";
        return (
          <div key={next}>
            <button
              type="button"
              disabled={blocked}
              onClick={() => openStatus(next)}
              className={
                index === 0
                  ? "h-11 w-full rounded-full bg-ink text-sm font-semibold text-paper transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
                  : "h-11 w-full rounded-full border border-stone-300 text-sm font-semibold transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-50"
              }
            >
              {STATUS_ACTION_LABEL[next] ?? ORDER_STATUS_LABEL[next]}
            </button>
            {blocked && (
              <p className="mt-1.5 text-xs text-neutral-500">
                Menunggu pembayaran lunas terverifikasi.
              </p>
            )}
          </div>
        );
      })}

      {canCancel && (
        <button
          type="button"
          onClick={() => {
            setReason("");
            setCancelling(true);
          }}
          className="h-11 w-full rounded-full border border-red-200 text-sm font-semibold text-red-600 transition hover:bg-red-50"
        >
          Batalkan pesanan
        </button>
      )}

      <Modal
        open={target !== null}
        onClose={() => setTarget(null)}
        title={target ? (STATUS_ACTION_LABEL[target] ?? ORDER_STATUS_LABEL[target]) : ""}
      >
        <p className="text-sm text-neutral-700">
          Status akan berubah menjadi{" "}
          <strong>{target ? ORDER_STATUS_LABEL[target] : ""}</strong>.
        </p>
        <div className="mt-4 space-y-1.5">
          <label htmlFor="status-note" className="text-sm font-semibold">
            Catatan untuk pelanggan (opsional)
          </label>
          <textarea
            id="status-note"
            rows={3}
            maxLength={300}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={textareaClass}
          />
          <p className="text-xs text-neutral-500">
            Catatan ini terlihat oleh pelanggan di halaman pesanannya.
          </p>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setTarget(null)}
            className="h-11 rounded-full border border-stone-300 px-5 text-sm font-semibold hover:border-ink"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={submitStatus}
            className="flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-paper hover:bg-neutral-800 disabled:opacity-70"
          >
            {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
            Ubah status
          </button>
        </div>
      </Modal>

      <Modal open={cancelling} onClose={() => setCancelling(false)} title="Batalkan pesanan?">
        <div className="space-y-3 text-sm leading-relaxed text-neutral-700">
          <p>
            Stok produk dalam pesanan ini akan <strong>dikembalikan satu kali</strong>.
            Pesanan yang dibatalkan tidak bisa dibuka kembali.
          </p>
          {paidAmount > 0 && (
            <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-amber-800">
              Ada pembayaran terverifikasi sebesar{" "}
              <strong>{formatRupiah(paidAmount)}</strong>. Pembatalan tidak otomatis
              mengembalikan dana. Catat pengembalian dana di menu Pembayaran.
            </p>
          )}
        </div>
        <div className="mt-4 space-y-1.5">
          <label htmlFor="cancel-reason" className="text-sm font-semibold">
            Alasan pembatalan
          </label>
          <textarea
            id="cancel-reason"
            rows={3}
            maxLength={300}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={textareaClass}
          />
          <p className="text-xs text-neutral-500">
            Alasan ini terlihat oleh pelanggan di halaman pesanannya.
          </p>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setCancelling(false)}
            className="h-11 rounded-full border border-stone-300 px-5 text-sm font-semibold hover:border-ink"
          >
            Kembali
          </button>
          <button
            type="button"
            disabled={pending || reason.trim().length < 5}
            onClick={submitCancel}
            className="flex h-11 items-center gap-2 rounded-full bg-red-600 px-6 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
            Ya, batalkan
          </button>
        </div>
      </Modal>
    </div>
  );
}