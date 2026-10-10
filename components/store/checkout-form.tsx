"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { createOrderAction, type CheckoutState } from "@/lib/actions/orders";
import { clearCart, useCartLines, useCartReady } from "@/lib/cart/store";
import {
  buildRows,
  computeTotal,
  useCartDetails,
} from "@/lib/cart/use-cart-details";
import { formatRupiah } from "@/lib/utils";

const inputClass =
  "h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10";

const initialState: CheckoutState = {};

type PickupInfo = {
  address: string | null;
  openingHours: string | null;
  instructions: string | null;
};

export function CheckoutForm({
  dpPercentage,
  pickup,
}: {
  dpPercentage: number;
  pickup: PickupInfo;
}) {
  const router = useRouter();
  const ready = useCartReady();
  const lines = useCartLines();
  const { map, loading, failed } = useCartDetails(lines);
  const [state, formAction, pending] = useActionState(
    createOrderAction,
    initialState
  );

  const rows = buildRows(lines, map, loading);
  const total = computeTotal(rows);
  const hasProblem = rows.some((r) => r.problem !== null);
  const dpEstimate = Math.round((total * dpPercentage) / 100);

  useEffect(() => {
    if (state.redirectTo) {
      clearCart();
      router.replace(state.redirectTo);
    }
  }, [state.redirectTo, router]);

  if (state.redirectTo) {
    return (
      <p role="status" className="rounded-2xl bg-mist p-6 text-sm font-medium">
        Pesanan berhasil dibuat. Mengalihkan ke ringkasan pesanan...
      </p>
    );
  }

  if (!ready) {
    return (
      <div className="h-64 animate-pulse rounded-2xl bg-stone-200" aria-busy="true" />
    );
  }

  if (lines.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 px-6 py-16 text-center">
        <h2 className="text-lg font-bold">Keranjang Anda kosong</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Tambahkan produk terlebih dahulu sebelum checkout.
        </p>
        <Link
          href="/products"
          className="mt-5 inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-semibold text-paper hover:bg-neutral-800"
        >
          Lihat produk
        </Link>
      </div>
    );
  }

  const blocked = pending || loading || failed || hasProblem;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:gap-14">
      <form action={formAction} className="space-y-6" noValidate>
        <input type="hidden" name="items" value={JSON.stringify(lines)} />

        {state.error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <p className="font-semibold">{state.error}</p>
            {state.issues && state.issues.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {state.issues.map((i, idx) => (
                  <li key={idx}>
                    {i.productName} (ukuran {i.size}):{" "}
                    {i.available > 0
                      ? `tersisa ${i.available}, diminta ${i.requested}`
                      : "tidak tersedia"}
                  </li>
                ))}
              </ul>
            )}
            {state.issues && state.issues.length > 0 && (
              <Link href="/cart" className="mt-3 inline-block font-semibold underline">
                Perbaiki keranjang
              </Link>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-semibold">
            Nama lengkap
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={80}
            defaultValue={state.values?.name}
            aria-invalid={!!state.fieldErrors?.name}
            aria-describedby={state.fieldErrors?.name ? "name-error" : undefined}
            className={inputClass}
          />
          {state.fieldErrors?.name && (
            <p id="name-error" className="text-xs text-red-600">
              {state.fieldErrors.name}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="whatsapp" className="text-sm font-semibold">
            Nomor WhatsApp
          </label>
          <input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            placeholder="081234567890"
            defaultValue={state.values?.whatsapp}
            aria-invalid={!!state.fieldErrors?.whatsapp}
            aria-describedby="whatsapp-help whatsapp-error"
            className={inputClass}
          />
          <p id="whatsapp-help" className="text-xs text-neutral-500">
            Penjual akan menghubungi nomor ini untuk konfirmasi.
          </p>
          {state.fieldErrors?.whatsapp && (
            <p id="whatsapp-error" className="text-xs text-red-600">
              {state.fieldErrors.whatsapp}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="note" className="text-sm font-semibold">
            Catatan (opsional)
          </label>
          <textarea
            id="note"
            name="note"
            rows={3}
            maxLength={500}
            defaultValue={state.values?.note}
            aria-invalid={!!state.fieldErrors?.note}
            className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10"
          />
          {state.fieldErrors?.note && (
            <p className="text-xs text-red-600">{state.fieldErrors.note}</p>
          )}
        </div>

        <div className="rounded-2xl bg-mist p-5 text-sm leading-relaxed">
          <p className="font-bold">Pengambilan di toko</p>
          <p className="mt-1 text-neutral-600">
            Pesanan diambil langsung di toko setelah dikonfirmasi penjual.
          </p>
          {pickup.address && <p className="mt-2 text-neutral-700">{pickup.address}</p>}
          {pickup.openingHours && (
            <p className="mt-2 whitespace-pre-line text-neutral-700">
              {pickup.openingHours}
            </p>
          )}
          {pickup.instructions && (
            <p className="mt-2 text-neutral-700">{pickup.instructions}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={blocked}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-paper transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
        >
          {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          {pending
            ? "Membuat pesanan..."
            : hasProblem
              ? "Perbaiki keranjang dahulu"
              : "Buat Pesanan"}
        </button>
        {hasProblem && (
          <p className="text-center text-sm text-red-600">
            Ada produk yang stoknya berubah.{" "}
            <Link href="/cart" className="font-semibold underline">
              Periksa keranjang
            </Link>
          </p>
        )}
      </form>

      <aside className="h-fit rounded-2xl bg-mist p-6 lg:sticky lg:top-24">
        <h2 className="text-lg font-bold">Pesanan Anda</h2>
        <ul className="mt-4 divide-y divide-stone-300/60 text-sm">
          {rows.map(({ line, detail }) =>
            detail && detail.status === "ok" ? (
              <li key={line.variantId} className="flex justify-between gap-3 py-3">
                <span>
                  <span className="block font-semibold">{detail.productName}</span>
                  <span className="text-neutral-600">
                    Ukuran {detail.size} x {line.quantity}
                  </span>
                </span>
                <span className="shrink-0 font-semibold">
                  {formatRupiah(detail.unitPrice * line.quantity)}
                </span>
              </li>
            ) : (
              <li key={line.variantId} className="py-3 text-neutral-500">
                {loading ? "Memuat..." : "Produk tidak tersedia"}
              </li>
            )
          )}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-stone-300/60 pt-4 text-sm">
          <div className="flex justify-between">
            <dt>Total</dt>
            <dd className="text-lg font-extrabold">{formatRupiah(total)}</dd>
          </div>
          <div className="flex justify-between text-neutral-600">
            <dt>Perkiraan DP ({dpPercentage}%)</dt>
            <dd>{formatRupiah(dpEstimate)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-neutral-500">
          Pesanan ini belum dianggap transaksi sebelum dikonfirmasi penjual.
          Harga dan stok diperiksa ulang oleh sistem saat pesanan dibuat.
        </p>
      </aside>
    </div>
  );
}