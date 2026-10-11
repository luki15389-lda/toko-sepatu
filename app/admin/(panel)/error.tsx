"use client";

export default function PanelError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-2xl border border-stone-line bg-white p-10 text-center">
      <h1 className="text-xl font-extrabold">Aksi tidak dapat diselesaikan</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-neutral-600">
        Jika Anda memakai akun demo, perubahan data memang dinonaktifkan (akun
        demo hanya bisa melihat). Jika bukan, coba lagi sebentar lagi.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 h-11 rounded-full bg-ink px-6 text-sm font-semibold text-paper hover:bg-neutral-800"
      >
        Kembali
      </button>
    </div>
  );
}