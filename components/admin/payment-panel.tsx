"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { Modal } from "@/components/admin/modal";
import { PaymentDecisionButtons } from "@/components/admin/payment-decision-buttons";
import { recordPayment, recordRefund } from "@/lib/actions/admin/payments";
import {
  PAYMENT_KIND_LABEL,
  PAYMENT_METHOD_LABEL,
  PAYMENT_RECORD_STATUS_LABEL,
} from "@/lib/order-labels";
import { cn, formatRupiah, formatTanggal, todayWib } from "@/lib/utils";

type Method = "BANK_TRANSFER" | "CASH" | "OTHER";

export type PaymentRow = {
  id: string;
  kind: string;
  amount: number;
  method: string;
  methodLabel: string | null;
  status: string;
  paidAt: string;
  verifiedByName: string | null;
  note: string | null;
};

const fieldClass =
  "h-11 w-full rounded-lg border border-stone-300 bg-white px-3.5 text-sm outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10";

function PaymentForm({
  orderId,
  mode,
  remaining,
  paidAmount,
  dpAmount,
  onDone,
}: {
  orderId: string;
  mode: "payment" | "refund";
  remaining: number;
  paidAmount: number;
  dpAmount: number;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Method>("BANK_TRANSFER");
  const [methodLabel, setMethodLabel] = useState("");
  const [paidAt, setPaidAt] = useState(() => todayWib());
  const [note, setNote] = useState("");
  const [verifyNow, setVerifyNow] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const value = Number(amount);
    if (!amount || !Number.isInteger(value) || value < 1) {
      setError("Isi nominal dengan bilangan bulat, minimal Rp1.");
      return;
    }

    startTransition(async () => {
      const result =
        mode === "payment"
          ? await recordPayment(orderId, { amount: value, method, methodLabel, paidAt, note, verifyNow })
          : await recordRefund(orderId, { amount: value, method, methodLabel, paidAt, note });

      if (result.ok) {
        toast.success(result.message);
        onDone();
      } else {
        setError(result.message);
      }
    });
  }

  const quick =
    "rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold hover:border-ink";

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="space-y-1.5">
        <label htmlFor="pay-amount" className="text-sm font-semibold">
          Nominal yang benar-benar {mode === "payment" ? "diterima" : "dikembalikan"} (Rp)
        </label>
        <input
          id="pay-amount"
          type="number"
          inputMode="numeric"
          min={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={fieldClass}
        />
        <div className="flex flex-wrap gap-2 pt-1">
          {mode === "payment" ? (
            <>
              {paidAmount === 0 && (
                <button type="button" className={quick} onClick={() => setAmount(String(Math.min(dpAmount, remaining)))}>
                  DP anjuran ({formatRupiah(Math.min(dpAmount, remaining))})
                </button>
              )}
              <button type="button" className={quick} onClick={() => setAmount(String(remaining))}>
                Sisa tagihan ({formatRupiah(remaining)})
              </button>
            </>
          ) : (
            <button type="button" className={quick} onClick={() => setAmount(String(paidAmount))}>
              Seluruh pembayaran ({formatRupiah(paidAmount)})
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="pay-method" className="text-sm font-semibold">Metode</label>
          <select
            id="pay-method"
            value={method}
            onChange={(e) => setMethod(e.target.value as Method)}
            className={fieldClass}
          >
            <option value="BANK_TRANSFER">Transfer bank</option>
            <option value="CASH">Tunai di toko</option>
            <option value="OTHER">Lainnya</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="pay-date" className="text-sm font-semibold">Tanggal</label>
          <input
            id="pay-date"
            type="date"
            max={todayWib()}
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      {method === "OTHER" && (
        <div className="space-y-1.5">
          <label htmlFor="pay-label" className="text-sm font-semibold">Nama metode</label>
          <input
            id="pay-label"
            type="text"
            maxLength={50}
            value={methodLabel}
            onChange={(e) => setMethodLabel(e.target.value)}
            placeholder="Contoh: QRIS, e-wallet"
            className={fieldClass}
          />
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="pay-note" className="text-sm font-semibold">Catatan verifikasi (opsional)</label>
        <textarea
          id="pay-note"
          rows={2}
          maxLength={300}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm outline-none focus:border-ink"
        />
      </div>

      {mode === "payment" && (
        <label className="flex items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={verifyNow}
            onChange={(e) => setVerifyNow(e.target.checked)}
            className="mt-0.5 size-4 accent-black"
          />
          <span>
            Saya sudah memeriksa dan memverifikasi pembayaran ini
            <span className="block text-xs text-neutral-500">
              Jika tidak dicentang, pembayaran menunggu verifikasi dan belum
              mengurangi tagihan.
            </span>
          </span>
        </label>
      )}

      <div className="flex justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={onDone}
          className="h-11 rounded-full border border-stone-300 px-5 text-sm font-semibold hover:border-ink"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-paper hover:bg-neutral-800 disabled:opacity-70"
        >
          {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          Simpan
        </button>
      </div>
    </form>
  );
}

export function PaymentPanel({
  orderId,
  orderStatus,
  total,
  dpAmount,
  dpPercentage,
  paidAmount,
  payments,
}: {
  orderId: string;
  orderStatus: string;
  total: number;
  dpAmount: number;
  dpPercentage: number;
  paidAmount: number;
  payments: PaymentRow[];
}) {
  const [mode, setMode] = useState<"payment" | "refund" | null>(null);
  const remaining = total - paidAmount;
  const canPay = orderStatus !== "CANCELLED" && remaining > 0;
  const canRefund = paidAmount > 0;

  return (
    <section className="rounded-2xl border border-stone-line bg-white p-6">
      <h2 className="mb-4 text-base font-bold">Pembayaran</h2>

      <dl className="space-y-2.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-neutral-600">Total pesanan</dt>
          <dd className="text-lg font-extrabold">{formatRupiah(total)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-600">DP yang dianjurkan ({dpPercentage}%)</dt>
          <dd className="font-semibold">{formatRupiah(dpAmount)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-600">Pembayaran terverifikasi</dt>
          <dd className="font-semibold">{formatRupiah(paidAmount)}</dd>
        </div>
        <div className="flex justify-between border-t border-stone-line pt-2.5">
          <dt className="text-neutral-600">Sisa tagihan</dt>
          <dd className="font-bold">{formatRupiah(remaining)}</dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!canPay}
          onClick={() => setMode("payment")}
          className="h-10 rounded-full bg-ink px-5 text-sm font-semibold text-paper hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
        >
          Catat pembayaran
        </button>
        <button
          type="button"
          disabled={!canRefund}
          onClick={() => setMode("refund")}
          className="h-10 rounded-full border border-stone-300 px-5 text-sm font-semibold hover:border-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          Catat pengembalian dana
        </button>
      </div>

      <h3 className="mb-2 mt-6 text-sm font-bold">Riwayat pembayaran</h3>
      {payments.length === 0 ? (
        <p className="text-sm text-neutral-500">Belum ada pembayaran yang dicatat.</p>
      ) : (
        <ul className="divide-y divide-stone-line text-sm">
          {payments.map((p) => (
            <li key={p.id} className="space-y-2 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {PAYMENT_KIND_LABEL[p.kind] ?? p.kind}{" "}
                    <span className="font-normal text-neutral-600">
                      · {p.method === "OTHER" && p.methodLabel ? p.methodLabel : (PAYMENT_METHOD_LABEL[p.method] ?? p.method)}
                    </span>
                  </p>
                  <p className="text-xs text-neutral-500">
                    {formatTanggal(p.paidAt)}
                    {p.verifiedByName ? ` · oleh ${p.verifiedByName}` : ""}
                  </p>
                  {p.note && <p className="mt-1 text-xs text-neutral-600">{p.note}</p>}
                </div>
                <div className="text-right">
                  <p className={cn("font-bold", p.kind === "REFUND" && "text-violet-700")}>
                    {p.kind === "REFUND" ? "-" : ""}
                    {formatRupiah(p.amount)}
                  </p>
                  <span
                    className={cn(
                      "mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      p.status === "VERIFIED" && "bg-emerald-50 text-emerald-700",
                      p.status === "PENDING_VERIFICATION" && "bg-amber-50 text-amber-700",
                      p.status === "REJECTED" && "bg-red-50 text-red-700"
                    )}
                  >
                    {PAYMENT_RECORD_STATUS_LABEL[p.status] ?? p.status}
                  </span>
                </div>
              </div>
              {p.status === "PENDING_VERIFICATION" && (
                <PaymentDecisionButtons paymentId={p.id} />
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={mode !== null}
        onClose={() => setMode(null)}
        title={mode === "refund" ? "Catat pengembalian dana" : "Catat pembayaran"}
      >
        {mode && (
          <PaymentForm
            orderId={orderId}
            mode={mode}
            remaining={remaining}
            paidAmount={paidAmount}
            dpAmount={dpAmount}
            onDone={() => setMode(null)}
          />
        )}
      </Modal>
    </section>
  );
}