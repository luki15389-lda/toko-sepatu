"use client";

import Link from "next/link";
import { ShoppingBag, Trash2 } from "lucide-react";
import { QuantityStepper } from "@/components/shared/quantity-stepper";
import { SafeImage } from "@/components/shared/safe-image";
import { MAX_QTY_PER_LINE } from "@/lib/cart/constants";
import {
  changeLineVariant,
  removeLine,
  setLineQuantity,
  useCartLines,
  useCartReady,
} from "@/lib/cart/store";
import {
  buildRows,
  computeTotal,
  useCartDetails,
  type CartRow,
} from "@/lib/cart/use-cart-details";
import { formatRupiah } from "@/lib/utils";

function RowSkeleton() {
  return (
    <li className="flex gap-4 py-6">
      <div className="size-24 animate-pulse rounded-xl bg-stone-200 sm:size-28" />
      <div className="flex-1 space-y-3">
        <div className="h-3 w-1/4 animate-pulse rounded bg-stone-200" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-stone-200" />
        <div className="h-9 w-40 animate-pulse rounded bg-stone-200" />
      </div>
    </li>
  );
}

function CartRowItem({ row }: { row: CartRow }) {
  const { line, detail, problem } = row;

  if (problem === "loading") return <RowSkeleton />;

  if (!detail || problem === "unavailable") {
    return (
      <li className="flex items-center justify-between gap-4 py-6">
        <p className="text-sm text-neutral-600">
          Produk ini sudah tidak tersedia. Hapus dari keranjang untuk melanjutkan.
        </p>
        <button
          type="button"
          onClick={() => removeLine(line.variantId)}
          className="shrink-0 rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold hover:border-ink"
        >
          Hapus
        </button>
      </li>
    );
  }

  const maxQty = Math.max(1, Math.min(detail.stock, MAX_QTY_PER_LINE));
  const sizeOptions = detail.sizes.filter(
    (s) => s.stock > 0 || s.variantId === line.variantId
  );

  return (
    <li className="flex gap-4 py-6">
      <Link
        href={`/products/${detail.productSlug}`}
        className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-mist sm:size-28"
      >
        <SafeImage
          src={detail.imageUrl}
          alt={detail.productName}
          fill
          sizes="112px"
          className="object-cover"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              {detail.brandName}
            </p>
            <Link
              href={`/products/${detail.productSlug}`}
              className="line-clamp-2 font-semibold hover:underline"
            >
              {detail.productName}
            </Link>
            <p className="mt-0.5 text-sm text-neutral-600">
              {formatRupiah(detail.unitPrice)} / pasang
            </p>
          </div>
          <button
            type="button"
            onClick={() => removeLine(line.variantId)}
            aria-label={`Hapus ${detail.productName} dari keranjang`}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-mist hover:text-ink"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label htmlFor={`size-${line.variantId}`} className="sr-only">
              Ukuran untuk {detail.productName}
            </label>
            <select
              id={`size-${line.variantId}`}
              value={line.variantId}
              onChange={(e) => changeLineVariant(line.variantId, e.target.value)}
              className="h-11 rounded-full border border-stone-300 bg-white px-4 text-sm font-medium outline-none focus:border-ink"
            >
              {sizeOptions.map((s) => (
                <option key={s.variantId} value={s.variantId}>
                  Ukuran {s.size}
                </option>
              ))}
            </select>
          </div>

          <QuantityStepper
            label={`Jumlah ${detail.productName}`}
            value={line.quantity}
            max={maxQty}
            disabled={detail.stock <= 0}
            onChange={(q) => setLineQuantity(line.variantId, q)}
          />

          <p className="ml-auto text-base font-bold">
            {formatRupiah(detail.unitPrice * line.quantity)}
          </p>
        </div>

        {problem === "out_of_stock" && (
          <p role="alert" className="text-sm font-medium text-red-600">
            Ukuran ini sedang habis. Pilih ukuran lain atau hapus dari keranjang.
          </p>
        )}
        {problem === "insufficient" && (
          <p role="alert" className="text-sm font-medium text-red-600">
            Stok tersisa {detail.stock} pasang.{" "}
            <button
              type="button"
              onClick={() => setLineQuantity(line.variantId, detail.stock)}
              className="underline underline-offset-2"
            >
              Sesuaikan jumlah
            </button>
          </p>
        )}
      </div>
    </li>
  );
}

export function CartView({ dpPercentage }: { dpPercentage: number }) {
  const ready = useCartReady();
  const lines = useCartLines();
  const { map, loading, failed } = useCartDetails(lines);

  const rows = buildRows(lines, map, loading);
  const total = computeTotal(rows);
  const hasProblem = rows.some((r) => r.problem !== null);
  const canCheckout = lines.length > 0 && !loading && !failed && !hasProblem;
  const dpEstimate = Math.round((total * dpPercentage) / 100);

  if (!ready) {
    return (
      <div aria-busy="true" aria-label="Memuat keranjang" className="divide-y divide-stone-line">
        <RowSkeleton />
        <RowSkeleton />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 px-6 py-20 text-center">
        <ShoppingBag className="size-10 text-neutral-400" aria-hidden />
        <h2 className="mt-4 text-lg font-bold">Keranjang Anda kosong</h2>
        <p className="mt-1 max-w-sm text-sm text-neutral-600">
          Telusuri koleksi kami dan tambahkan sepatu favorit Anda.
        </p>
        <Link
          href="/products"
          className="mt-5 inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-semibold text-paper hover:bg-neutral-800"
        >
          Mulai belanja
        </Link>
      </div>
    );
  }

  if (failed) {
    return (
      <div role="alert" className="rounded-2xl bg-red-50 p-6 text-sm text-red-700">
        Data keranjang gagal dimuat.{" "}
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="font-semibold underline"
        >
          Muat ulang
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-14">
      <ul className="divide-y divide-stone-line border-y border-stone-line">
        {rows.map((row) => (
          <CartRowItem key={row.line.variantId} row={row} />
        ))}
      </ul>

      <aside className="h-fit rounded-2xl bg-mist p-6 lg:sticky lg:top-24">
        <h2 className="text-lg font-bold">Ringkasan</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-neutral-600">Total belanja</dt>
            <dd className="text-lg font-extrabold">{formatRupiah(total)}</dd>
          </div>
          <div className="flex justify-between text-neutral-600">
            <dt>Perkiraan DP ({dpPercentage}%)</dt>
            <dd>{formatRupiah(dpEstimate)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-neutral-500">
          Nominal DP dan metode pembayaran dikonfirmasi penjual lewat WhatsApp.
          Harga akhir dihitung ulang saat Anda membuat pesanan.
        </p>

        {canCheckout ? (
          <Link
            href="/checkout"
            className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-ink text-sm font-semibold text-paper transition hover:bg-neutral-800"
          >
            Lanjut ke Checkout
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="mt-6 flex h-12 w-full cursor-not-allowed items-center justify-center rounded-full bg-stone-300 text-sm font-semibold text-stone-500"
          >
            {loading ? "Memeriksa stok..." : "Perbaiki keranjang dahulu"}
          </button>
        )}

        <Link
          href="/products"
          className="mt-3 block text-center text-sm font-semibold underline underline-offset-4"
        >
          Lanjut belanja
        </Link>
      </aside>
    </div>
  );
}