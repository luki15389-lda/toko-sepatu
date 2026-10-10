"use client";

import Link from "next/link";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-extrabold">Terjadi kesalahan</h1>
      <p className="max-w-sm text-sm text-neutral-600">
        Maaf, ada masalah saat memuat halaman ini. Silakan coba lagi.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-semibold text-paper hover:bg-neutral-800"
        >
          Coba lagi
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-full border border-stone-300 px-6 text-sm font-semibold hover:border-ink"
        >
          Ke beranda
        </Link>
      </div>
    </main>
  );
}