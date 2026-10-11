"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { Modal } from "@/components/admin/modal";
import { adjustStock } from "@/lib/actions/admin/inventory";
import { ADJUST_KINDS, ADJUST_KIND_LABEL } from "@/lib/validations/inventory";

const fieldClass =
  "h-11 w-full rounded-lg border border-stone-300 bg-white px-3.5 text-sm outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10";

export function StockAdjustButton({
  variantId,
  label,
  currentStock,
}: {
  variantId: string;
  label: string;
  currentStock: number;
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<(typeof ADJUST_KINDS)[number]>("RESTOCK");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openModal() {
    setKind("RESTOCK");
    setQuantity("");
    setNote("");
    setError(null);
    setOpen(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const value = Number(quantity);
    if (!quantity || !Number.isInteger(value) || value < 1) {
      setError("Isi jumlah dengan bilangan bulat, minimal 1.");
      return;
    }
    startTransition(async () => {
      const result = await adjustStock(variantId, { kind, quantity: value, note });
      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="h-9 rounded-full border border-stone-300 px-4 text-xs font-semibold hover:border-ink"
      >
        Ubah stok
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Ubah stok">
        <p className="mb-4 text-sm text-neutral-700">
          <strong>{label}</strong>
          <br />
          Stok saat ini: <strong>{currentStock}</strong>
        </p>
        <form onSubmit={submit} className="space-y-4" noValidate>
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="space-y-1.5">
            <label htmlFor="adj-kind" className="text-sm font-semibold">Jenis perubahan</label>
            <select
              id="adj-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as (typeof ADJUST_KINDS)[number])}
              className={fieldClass}
            >
              {ADJUST_KINDS.map((k) => (
                <option key={k} value={k}>{ADJUST_KIND_LABEL[k]}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="adj-qty" className="text-sm font-semibold">Jumlah (pasang)</label>
            <input
              id="adj-qty"
              type="number"
              inputMode="numeric"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="adj-note" className="text-sm font-semibold">
              Catatan{kind === "RESTOCK" ? " (opsional)" : " (wajib)"}
            </label>
            <input
              id="adj-note"
              type="text"
              maxLength={200}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={kind === "RESTOCK" ? "Contoh: kiriman supplier" : "Contoh: selisih hitung stok"}
              className={fieldClass}
            />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-11 rounded-full border border-stone-300 px-5 text-sm font-semibold hover:border-ink"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-paper hover:bg-neutral-800 disabled:opacity-70"
            >
              {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
              Simpan
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}