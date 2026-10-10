"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Archive, ArchiveRestore, LoaderCircle, Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/admin/modal";
import {
  deleteProduct,
  setProductArchived,
} from "@/lib/actions/admin/products";
import type { ActionResult } from "@/lib/actions/admin/types";

export function ProductRowActions({
  id,
  name,
  archived,
}: {
  id: string;
  name: string;
  archived: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function run(task: () => Promise<ActionResult>) {
    startTransition(async () => {
      const result = await task();
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      setConfirming(false);
    });
  }

  const btn =
    "flex size-9 items-center justify-center rounded-full text-neutral-600 transition hover:bg-mist hover:text-ink disabled:opacity-40";

  return (
    <>
      <div className="flex justify-end gap-1">
        <Link
          href={`/admin/products/${id}/edit`}
          aria-label={`Edit ${name}`}
          title="Edit"
          className={btn}
        >
          <Pencil className="size-4" aria-hidden />
        </Link>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setProductArchived(id, !archived))}
          aria-label={`${archived ? "Pulihkan" : "Arsipkan"} ${name}`}
          title={archived ? "Pulihkan" : "Arsipkan"}
          className={btn}
        >
          {archived ? (
            <ArchiveRestore className="size-4" aria-hidden />
          ) : (
            <Archive className="size-4" aria-hidden />
          )}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirming(true)}
          aria-label={`Hapus ${name}`}
          title="Hapus"
          className={`${btn} hover:text-red-600`}
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>

      <Modal open={confirming} onClose={() => setConfirming(false)} title="Hapus produk?">
        <p className="text-sm leading-relaxed text-neutral-700">
          Produk <strong>{name}</strong> beserta foto dan ukurannya akan dihapus
          permanen. Jika produk ini pernah dipesan, penghapusan ditolak dan Anda
          disarankan mengarsipkannya.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="h-11 rounded-full border border-stone-300 px-5 text-sm font-semibold hover:border-ink"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => deleteProduct(id))}
            className="flex h-11 items-center gap-2 rounded-full bg-red-600 px-6 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-70"
          >
            {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
            Ya, hapus
          </button>
        </div>
      </Modal>
    </>
  );
}