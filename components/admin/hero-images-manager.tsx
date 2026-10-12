"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  LoaderCircle,
  Trash2,
} from "lucide-react";
import { SafeImage } from "@/components/shared/safe-image";
import { setHeroImages } from "@/lib/actions/admin/hero";
import { compressImage } from "@/lib/client/compress-image";
import { MAX_HERO_IMAGES } from "@/lib/hero";

export function HeroImagesManager({ initial }: { initial: string[] }) {
  const [images, setImages] = useState(initial);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Menyimpan daftar baru; jika gagal, tampilan dikembalikan ke daftar sebelumnya. */
  async function commit(next: string[], previous: string[]): Promise<boolean> {
    setImages(next);
    try {
      const result = await setHeroImages(next);
      if (!result.ok) {
        setImages(previous);
        toast.error(result.message);
        return false;
      }
      return true;
    } catch {
      setImages(previous);
      toast.error("Perubahan tidak dapat disimpan. Akun demo hanya bisa melihat data.");
      return false;
    }
  }

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);

    let current = images;
    for (const file of Array.from(files)) {
      if (current.length >= MAX_HERO_IMAGES) {
        toast.error(`Maksimal ${MAX_HERO_IMAGES} foto.`);
        break;
      }
      try {
        const compressed = await compressImage(file);
        const body = new FormData();
        body.append("file", compressed);

        const res = await fetch("/api/admin/upload", { method: "POST", body });
        const json = (await res.json().catch(() => ({}))) as {
          url?: string;
          error?: string;
        };
        if (!res.ok || !json.url) {
          throw new Error(json.error ?? "Gagal mengunggah foto.");
        }

        const next = [...current, json.url];
        const ok = await commit(next, current);
        if (!ok) break;
        current = next;
        toast.success("Foto ditambahkan.");
      } catch (error) {
        toast.error(
          `${file.name}: ${error instanceof Error ? error.message : "Gagal mengunggah."}`
        );
      }
    }

    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    void commit(next, images);
  }

  function remove(index: number) {
    void commit(images.filter((_, i) => i !== index), images);
  }

  const smallBtn =
    "flex size-8 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition hover:bg-white disabled:opacity-40";

  return (
    <section className="rounded-2xl border border-stone-line bg-white p-6">
      <h2 className="text-base font-bold">Foto hero beranda</h2>
      <p className="mb-5 mt-1 text-sm text-neutral-500">
        Foto di bagian paling atas beranda. Jika lebih dari satu, foto berganti
        otomatis setiap 5 detik. Paling baik berbentuk landscape 4:3 (misalnya
        1200 x 900 piksel). Perubahan langsung tersimpan.
      </p>

      {images.length > 0 && (
        <ul className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((url, index) => (
            <li key={url} className="rounded-xl border border-stone-line p-3">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-mist">
                <SafeImage
                  src={url}
                  alt={`Foto hero ${index + 1}`}
                  fill
                  sizes="240px"
                  className="object-cover"
                />
                <span className="absolute left-2 top-2 rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold text-paper">
                  {index + 1}
                </span>
                <div className="absolute right-2 top-2 flex gap-1">
                  <button
                    type="button"
                    disabled={busy || index === 0}
                    onClick={() => move(index, -1)}
                    aria-label={`Geser foto ${index + 1} ke depan`}
                    className={smallBtn}
                  >
                    <ArrowLeft className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    disabled={busy || index === images.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label={`Geser foto ${index + 1} ke belakang`}
                    className={smallBtn}
                  >
                    <ArrowRight className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => remove(index)}
                    aria-label={`Hapus foto ${index + 1}`}
                    className={`${smallBtn} hover:text-red-600`}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        id="hero-images-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={(e) => onFiles(e.target.files)}
      />
      <label
        htmlFor="hero-images-input"
        className={`inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-paper hover:bg-neutral-800 ${
          busy || images.length >= MAX_HERO_IMAGES ? "pointer-events-none opacity-60" : ""
        }`}
      >
        {busy ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
        ) : (
          <ImagePlus className="size-4" aria-hidden />
        )}
        {busy ? "Mengunggah..." : "Unggah foto"}
      </label>
      <p className="mt-2 text-xs text-neutral-500">
        {images.length} dari {MAX_HERO_IMAGES} foto. JPG, PNG, atau WebP.
      </p>
    </section>
  );
}