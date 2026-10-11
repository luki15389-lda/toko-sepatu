"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { Modal } from "@/components/admin/modal";
import { SafeImage } from "@/components/shared/safe-image";
import { compressImage } from "@/lib/client/compress-image";
import type { ActionResult } from "@/lib/actions/admin/types";

export function TaxonomyImageCell({
  id,
  name,
  imageUrl,
  setImage,
}: {
  id: string;
  name: string;
  imageUrl: string | null;
  setImage: (id: string, url: string | null) => Promise<ActionResult>;
}) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
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

      const result = await setImage(id, json.url);
      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengunggah.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove() {
    startTransition(async () => {
      const result = await setImage(id, null);
      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Ubah foto ${name}`}
        className="relative flex size-12 items-center justify-center overflow-hidden rounded-lg border border-stone-line bg-mist hover:border-ink"
      >
        {imageUrl ? (
          <SafeImage src={imageUrl} alt="" fill sizes="48px" className="object-cover" />
        ) : (
          <ImagePlus className="size-5 text-neutral-400" aria-hidden />
        )}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={`Foto kategori: ${name}`}>
        <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-xl bg-mist">
          {imageUrl ? (
            <SafeImage src={imageUrl} alt={name} fill sizes="480px" className="object-cover" />
          ) : (
            <p className="flex h-full items-center justify-center text-sm text-neutral-500">
              Belum ada foto
            </p>
          )}
        </div>

        <p className="mb-4 text-xs leading-relaxed text-neutral-500">
          Foto dipakai di bagian &quot;Belanja per kategori&quot; di beranda. Paling baik
          berbentuk landscape (perbandingan 4:3, misalnya 800 x 600 piksel) dan
          bagian pentingnya berada di tengah. JPG, PNG, atau WebP.
        </p>

        <input
          ref={inputRef}
          id={`cat-image-${id}`}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => onFile(e.target.files?.[0])}
        />

        <div className="flex flex-wrap justify-end gap-3">
          {imageUrl && (
            <button
              type="button"
              disabled={pending || uploading}
              onClick={remove}
              className="flex h-11 items-center gap-2 rounded-full border border-red-200 px-5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              <Trash2 className="size-4" aria-hidden />
              Hapus foto
            </button>
          )}
          <label
            htmlFor={`cat-image-${id}`}
            className={`flex h-11 cursor-pointer items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-paper hover:bg-neutral-800 ${
              uploading ? "pointer-events-none opacity-70" : ""
            }`}
          >
            {uploading ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : (
              <ImagePlus className="size-4" aria-hidden />
            )}
            {uploading ? "Mengunggah..." : imageUrl ? "Ganti foto" : "Pilih foto"}
          </label>
        </div>
      </Modal>
    </>
  );
}