import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-display text-7xl font-extrabold">404</p>
      <h1 className="text-xl font-bold">Halaman tidak ditemukan</h1>
      <p className="max-w-sm text-sm text-neutral-600">
        Halaman yang Anda cari tidak ada, sudah dipindahkan, atau belum tersedia.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-semibold text-paper hover:bg-neutral-800"
      >
        Kembali ke beranda
      </Link>
    </main>
  );
}