"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { saveOrderNotes } from "@/lib/actions/admin/orders";

const textareaClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10";

export function OrderNotesForm({
  orderId,
  customerNote,
  adminNote,
}: {
  orderId: string;
  customerNote: string;
  adminNote: string;
}) {
  const [customer, setCustomer] = useState(customerNote);
  const [internal, setInternal] = useState(adminNote);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveOrderNotes(orderId, {
        customerNote: customer,
        adminNote: internal,
      });
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="note-customer" className="text-sm font-semibold">
          Catatan untuk pelanggan
        </label>
        <textarea
          id="note-customer"
          rows={3}
          maxLength={500}
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          className={textareaClass}
        />
        <p className="text-xs text-neutral-500">Tampil di halaman pesanan pelanggan.</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="note-internal" className="text-sm font-semibold">
          Catatan internal
        </label>
        <textarea
          id="note-internal"
          rows={3}
          maxLength={1000}
          value={internal}
          onChange={(e) => setInternal(e.target.value)}
          className={textareaClass}
        />
        <p className="text-xs text-neutral-500">Hanya terlihat oleh admin.</p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-paper hover:bg-neutral-800 disabled:opacity-70"
      >
        {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
        Simpan catatan
      </button>
    </form>
  );
}