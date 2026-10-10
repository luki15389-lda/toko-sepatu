"use client";

import {
  useFieldArray,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import type { ProductFormValues } from "@/lib/validations/product";

const PRESET_SIZES = ["39", "40", "41", "42", "43", "44"];

const inputClass =
  "h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10 read-only:bg-mist read-only:text-neutral-500";

export function ProductVariantsField({
  control,
  register,
  errors,
  lockedVariantIds,
}: {
  control: Control<ProductFormValues>;
  register: UseFormRegister<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  lockedVariantIds: string[];
}) {
  const { fields, append, remove } = useFieldArray({ control, name: "variants" });
  const watched = useWatch({ control, name: "variants" });

  const totalStock = (watched ?? []).reduce(
    (sum, v) => sum + (Number.isFinite(v?.stock) ? v.stock : 0),
    0
  );

  function addPreset() {
    const existing = new Set((watched ?? []).map((v) => v.size.trim().toLowerCase()));
    for (const size of PRESET_SIZES) {
      if (!existing.has(size)) {
        append({ variantId: null, size, sku: "", stock: 0, isAvailable: true });
      }
    }
  }

  const rootError = errors.variants?.root?.message ?? errors.variants?.message;

  return (
    <div>
      {fields.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th scope="col" className="pb-2 pr-3 font-semibold">Ukuran</th>
                <th scope="col" className="pb-2 pr-3 font-semibold">SKU (opsional)</th>
                <th scope="col" className="pb-2 pr-3 font-semibold">Stok</th>
                <th scope="col" className="pb-2 pr-3 font-semibold">Tersedia</th>
                <th scope="col" className="pb-2 font-semibold">
                  <span className="sr-only">Hapus</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => {
                const existing = field.variantId !== null;
                const locked =
                  existing && lockedVariantIds.includes(field.variantId as string);
                const rowErrors = errors.variants?.[index];

                return (
                  <tr key={field.id} className="align-top">
                    <td className="pb-3 pr-3">
                      <label htmlFor={`v-size-${index}`} className="sr-only">
                        Ukuran baris {index + 1}
                      </label>
                      <input
                        id={`v-size-${index}`}
                        type="text"
                        className={`${inputClass} w-24`}
                        aria-invalid={!!rowErrors?.size}
                        {...register(`variants.${index}.size`)}
                      />
                      {rowErrors?.size && (
                        <p className="mt-1 text-xs text-red-600">{rowErrors.size.message}</p>
                      )}
                    </td>
                    <td className="pb-3 pr-3">
                      <label htmlFor={`v-sku-${index}`} className="sr-only">
                        SKU ukuran baris {index + 1}
                      </label>
                      <input
                        id={`v-sku-${index}`}
                        type="text"
                        placeholder="Otomatis"
                        className={`${inputClass} w-40`}
                        aria-invalid={!!rowErrors?.sku}
                        {...register(`variants.${index}.sku`)}
                      />
                      {rowErrors?.sku && (
                        <p className="mt-1 text-xs text-red-600">{rowErrors.sku.message}</p>
                      )}
                    </td>
                    <td className="pb-3 pr-3">
                      <label htmlFor={`v-stock-${index}`} className="sr-only">
                        Stok baris {index + 1}
                      </label>
                      <input
                        id={`v-stock-${index}`}
                        type="number"
                        min={0}
                        readOnly={existing}
                        title={
                          existing
                            ? "Stok ukuran yang sudah ada diubah lewat menu Stok."
                            : undefined
                        }
                        className={`${inputClass} w-24`}
                        aria-invalid={!!rowErrors?.stock}
                        {...register(`variants.${index}.stock`, { valueAsNumber: true })}
                      />
                      {rowErrors?.stock && (
                        <p className="mt-1 text-xs text-red-600">{rowErrors.stock.message}</p>
                      )}
                    </td>
                    <td className="pb-3 pr-3 pt-2.5">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="size-4 accent-black"
                          {...register(`variants.${index}.isAvailable`)}
                        />
                        <span className="sr-only">Ukuran baris {index + 1} tersedia</span>
                      </label>
                    </td>
                    <td className="pb-3 pt-1">
                      <button
                        type="button"
                        disabled={locked}
                        onClick={() => remove(index)}
                        aria-label={`Hapus ukuran baris ${index + 1}`}
                        title={
                          locked
                            ? "Ukuran ini sudah pernah dipesan. Tandai tidak tersedia saja."
                            : "Hapus ukuran"
                        }
                        className="flex size-9 items-center justify-center rounded-full text-neutral-500 transition hover:bg-mist hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-neutral-500"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {rootError && <p className="mb-3 text-sm text-red-600">{rootError}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() =>
            append({ variantId: null, size: "", sku: "", stock: 0, isAvailable: true })
          }
          className="inline-flex h-10 items-center gap-2 rounded-full border border-stone-300 px-4 text-sm font-semibold transition hover:border-ink"
        >
          <Plus className="size-4" aria-hidden />
          Tambah ukuran
        </button>
        <button
          type="button"
          onClick={addPreset}
          className="inline-flex h-10 items-center rounded-full border border-stone-300 px-4 text-sm font-semibold transition hover:border-ink"
        >
          Isi ukuran 39 - 44
        </button>
        <p className="ml-auto text-sm text-neutral-600">
          Total stok: <strong>{totalStock}</strong>
        </p>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-neutral-500">
        Stok awal hanya diisi saat ukuran dibuat. Setelah itu, stok diubah lewat
        menu Stok supaya tidak tertimpa oleh pesanan yang masuk bersamaan.
      </p>
    </div>
  );
}