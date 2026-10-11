"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { Modal } from "@/components/admin/modal";
import { decidePayment } from "@/lib/actions/admin/payments";

export function PaymentDecisionButtons({ paymentId }: { paymentId: string }) {
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  function decide(decision: "verify" | "reject") {
    startTransition(async () => {
      const result = await decidePayment(paymentId, decision, decision === "reject" ? note : "");
      if (result.ok) {
        toast.success(result.message);
        setRejecting(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => decide("verify")}
          className="h-9 rounded-full bg-ink px-4 text-xs font-semibold text-paper hover:bg-neutral-800 disabled:opacity-60"
        >
          Verifikasi
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setNote("");
            setRejecting(true);
          }}
          className="h-9 rounded-full border border-stone-300 px-4 text-xs font-semibold hover:border-ink disabled:opacity-60"
        >
          Tolak
        </button>
      </div>

      <Modal open={rejecting} onClose={() => setRejecting(false)} title="Tolak pembayaran?">
        <label htmlFor="reject-note" className="text-sm font-semibold">
          Alasan penolakan (opsional)
        </label>
        <textarea
          id="reject-note"
          rows={3}
          maxLength={300}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm outline-none focus:border-ink"
        />
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setRejecting(false)}
            className="h-11 rounded-full border border-stone-300 px-5 text-sm font-semibold hover:border-ink"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => decide("reject")}
            className="flex h-11 items-center gap-2 rounded-full bg-red-600 px-6 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-70"
          >
            {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
            Ya, tolak
          </button>
        </div>
      </Modal>
    </>
  );
}