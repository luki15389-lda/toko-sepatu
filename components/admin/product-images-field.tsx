"use client";

import { useRef, useState } from "react";
import {
  useFieldArray,
  type Control,
  type UseFormRegister,
} from "react-hook-form";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  LoaderCircle,
  Trash2,
} from "lucide-react";
import { SafeImage } from "@/components/shared/safe-image";
import { compressImage } from "@/lib/client/compress-image";
import {
  MAX_PRODUCT_IMAGES,
  type ProductFormValues,
} from "@/lib/validations/product";

export function ProductImagesField({
  control,
  register,
}: {
  control: Control<ProductFormValues>;
  register: UseFormRegister<ProductFormValues>;
}) {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "images",
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const room = MAX_PRODUCT_IMAGES - fields.length;
    if (room <= 0) {
      toast.error(`Maksimal ${MAX_PRODUCT_IMAGES} foto.`);
      return;
    }

    setUploading(true);
    for (const file of Array.from(files).slice(0, room)) {
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
        append({ url: json.url, alt: "" });
      } catch (error) {
        toast.error(
          `${file.name}: ${error instanceof Error ? error.message : "Gagal mengunggah."}`
        );
      }
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  const smallBtn =
    "flex size-8 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm transition hover:bg-white disabled:opacity-40";

  return (
    <div>
      {fields.length > 0 && (
        <ul className="mb-4 grid gap-4 sm:grid-cols-2">
          {fields.map((field, index) => (
            <li key={field.id} className="rounded-xl border border-stone-line p-3">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-mist">
                <SafeImage
                  src={field.url}
                  alt={field.alt || `Foto ${index + 1}`}
                  fill
                  sizes="240px"
                  className="object-cover"
                />
                {index === 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold uppercase text-paper">
                    Foto utama
                  </span>
                )}
                <div className="absolute right-2 top-2 flex gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                    aria-label={`Geser foto ${index + 1} ke depan`}
                    className={smallBtn}
                  >
                    <ArrowLeft className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    disabled={index === fields.length - 1}
                    onClick={() => move(index, index + 1)}
                    aria-label={`Geser foto ${index + 1} ke belakang`}
                    className={smallBtn}
                  >
                    <ArrowRight className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label={`Hapus foto ${index + 1}`}
                    className={`${smallBtn} hover:text-red-600`}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              </div>
              <label htmlFor={`img-alt-${index}`} className="sr-only">
                Deskripsi foto {index + 1}
              </label>
              <input
                id={`img-alt-${index}`}
                type="text"
                placeholder="Deskripsi foto (opsional)"
                className="mt-3 h-10 w-full rounded-lg border border-stone-300 px-3 text-sm outline-none focus:border-ink"
                {...register(`images.${index}.alt`)}
              />
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        id="product-images-input"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <label
        htmlFor="product-images-input"
        className={`inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-stone-300 px-5 text-sm font-semibold transition hover:border-ink ${
          uploading ? "pointer-events-none opacity-60" : ""
        }`}
      >
        {uploading ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
        ) : (
          <ImagePlus className="size-4" aria-hidden />
        )}
        {uploading ? "Mengunggah..." : "Unggah foto"}
      </label>
      <p className="mt-2 text-xs text-neutral-500">
        JPG, PNG, atau WebP. Maksimal {MAX_PRODUCT_IMAGES} foto. Foto pertama jadi
        foto utama. Foto dikecilkan otomatis agar cepat dimuat.
      </p>
    </div>
  );
}