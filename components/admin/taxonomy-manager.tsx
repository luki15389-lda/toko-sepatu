"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  LoaderCircle,
  Pencil,
  Plus,
  Power,
  Trash2,
} from "lucide-react";
import { Modal } from "@/components/admin/modal";
import type { ActionResult } from "@/lib/actions/admin/types";
import {
  taxonomySchema,
  type TaxonomyFormValues,
} from "@/lib/validations/taxonomy";
import { cn } from "@/lib/utils";
import { TaxonomyImageCell } from "@/components/admin/taxonomy-image-cell";

export type TaxonomyItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  productCount: number;
  imageUrl?: string | null;
};

type Actions = {
  save: (id: string | null, values: TaxonomyFormValues) => Promise<ActionResult>;
  remove: (id: string) => Promise<ActionResult>;
  toggle: (id: string, isActive: boolean) => Promise<ActionResult>;
  setImage?: (id: string, url: string | null) => Promise<ActionResult>;
};

const inputClass =
  "h-11 w-full rounded-lg border border-stone-300 bg-white px-3.5 text-sm outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10";

function TaxonomyForm({
  item,
  noun,
  save,
  onDone,
}: {
  item: TaxonomyItem | null;
  noun: string;
  save: Actions["save"];
  onDone: () => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TaxonomyFormValues>({
    resolver: zodResolver(taxonomySchema),
    defaultValues: {
      name: item?.name ?? "",
      slug: item?.slug ?? "",
      description: item?.description ?? "",
      isActive: item?.isActive ?? true,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await save(item?.id ?? null, values);

    if (result.ok) {
      toast.success(result.message);
      onDone();
      return;
    }

    const fields: (keyof TaxonomyFormValues)[] = ["name", "slug", "description"];
    for (const field of fields) {
      const message = result.fieldErrors?.[field];
      if (message) setError(field, { message });
    }
    toast.error(result.message);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="tx-name" className="text-sm font-semibold">
          Nama {noun}
        </label>
        <input
          id="tx-name"
          type="text"
          autoFocus
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "tx-name-error" : undefined}
          className={inputClass}
          {...register("name")}
        />
        {errors.name && (
          <p id="tx-name-error" className="text-xs text-red-600">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="tx-slug" className="text-sm font-semibold">
          Slug
        </label>
        <input
          id="tx-slug"
          type="text"
          aria-invalid={!!errors.slug}
          aria-describedby="tx-slug-help"
          className={inputClass}
          {...register("slug")}
        />
        <p id="tx-slug-help" className="text-xs text-neutral-500">
          Dipakai di alamat halaman. Kosongkan untuk dibuat otomatis dari nama.
        </p>
        {errors.slug && (
          <p className="text-xs text-red-600">{errors.slug.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="tx-desc" className="text-sm font-semibold">
          Deskripsi (opsional)
        </label>
        <textarea
          id="tx-desc"
          rows={3}
          aria-invalid={!!errors.description}
          className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10"
          {...register("description")}
        />
        {errors.description && (
          <p className="text-xs text-red-600">{errors.description.message}</p>
        )}
      </div>

      <label className="flex items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          className="size-4 accent-black"
          {...register("isActive")}
        />
        Aktif (tampil di website)
      </label>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onDone}
          className="h-11 rounded-full border border-stone-300 px-5 text-sm font-semibold hover:border-ink"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-paper hover:bg-neutral-800 disabled:opacity-70"
        >
          {isSubmitting && (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          )}
          Simpan
        </button>
      </div>
    </form>
  );
}

export function TaxonomyManager({
  title,
  noun,
  description,
  items,
  actions,
}: {
  title: string;
  noun: string; // contoh: "kategori"
  description: string;
  items: TaxonomyItem[];
  actions: Actions;
}) {
  const [editing, setEditing] = useState<TaxonomyItem | "new" | null>(null);
  const [deleting, setDeleting] = useState<TaxonomyItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function run(id: string, task: () => Promise<ActionResult>) {
    setBusyId(id);
    startTransition(async () => {
      const result = await task();
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      setBusyId(null);
      setDeleting(null);
    });
  }

  const iconBtn =
    "flex size-9 items-center justify-center rounded-full text-neutral-600 transition hover:bg-mist hover:text-ink disabled:opacity-40";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">{title}</h1>
          <p className="mt-1 text-sm text-neutral-500">{description}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-paper hover:bg-neutral-800"
        >
          <Plus className="size-4" aria-hidden />
          Tambah {noun}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
          <h2 className="text-lg font-bold">Belum ada {noun}</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Klik &quot;Tambah {noun}&quot; untuk membuat yang pertama.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-line bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-stone-line bg-mist text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                {actions.setImage && (
                  <th scope="col" className="px-5 py-3 font-semibold">Foto</th>
                )}
                <th scope="col" className="px-5 py-3 font-semibold">Nama</th>
                <th scope="col" className="px-5 py-3 font-semibold">Slug</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Produk</th>
                <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-line">
              {items.map((item) => {
                const busy = busyId === item.id;
                return (
                  <tr key={item.id} className={cn(busy && "opacity-60")}>
                    {actions.setImage && (
                      <td className="px-5 py-4">
                        <TaxonomyImageCell
                          id={item.id}
                          name={item.name}
                          imageUrl={item.imageUrl ?? null}
                          setImage={actions.setImage}
                        />
                      </td>
                    )}
                    <td className="px-5 py-4">
                      <p className="font-semibold">{item.name}</p>
                      {item.description && (
                        <p className="mt-0.5 line-clamp-1 max-w-xs text-xs text-neutral-500">
                          {item.description}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-neutral-600">{item.slug}</td>
                    <td className="px-5 py-4 text-right tabular-nums">
                      {item.productCount}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-semibold",
                          item.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-stone-100 text-stone-600"
                        )}
                      >
                        {item.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setEditing(item)}
                          aria-label={`Edit ${item.name}`}
                          title="Edit"
                          className={iconBtn}
                        >
                          <Pencil className="size-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            run(item.id, () =>
                              actions.toggle(item.id, !item.isActive)
                            )
                          }
                          aria-label={`${item.isActive ? "Nonaktifkan" : "Aktifkan"} ${item.name}`}
                          title={item.isActive ? "Nonaktifkan" : "Aktifkan"}
                          className={iconBtn}
                        >
                          <Power className="size-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setDeleting(item)}
                          aria-label={`Hapus ${item.name}`}
                          title="Hapus"
                          className={cn(iconBtn, "hover:text-red-600")}
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? `Tambah ${noun}` : `Edit ${noun}`}
      >
        <TaxonomyForm
          item={editing === "new" || editing === null ? null : editing}
          noun={noun}
          save={actions.save}
          onDone={() => setEditing(null)}
        />
      </Modal>

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={`Hapus ${noun}?`}
      >
        <p className="text-sm leading-relaxed text-neutral-700">
          {noun.charAt(0).toUpperCase() + noun.slice(1)}{" "}
          <strong>{deleting?.name}</strong> akan dihapus permanen. Tindakan ini
          tidak dapat dibatalkan. Jika masih dipakai produk, penghapusan akan
          ditolak.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setDeleting(null)}
            className="h-11 rounded-full border border-stone-300 px-5 text-sm font-semibold hover:border-ink"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={busyId !== null}
            onClick={() => deleting && run(deleting.id, () => actions.remove(deleting.id))}
            className="flex h-11 items-center gap-2 rounded-full bg-red-600 px-6 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-70"
          >
            {busyId !== null && (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            )}
            Ya, hapus
          </button>
        </div>
      </Modal>
    </div>
  );
}