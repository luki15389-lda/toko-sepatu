"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { LoaderCircle, MessageCircle } from "lucide-react";
import { Modal } from "@/components/admin/modal";
import { regenerateAccessLink } from "@/lib/actions/admin/order-access";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function OrderAccessLink({
  orderId,
  orderNumber,
  customerName,
  customerWhatsapp,
  storeName,
}: {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerWhatsapp: string;
  storeName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function generate() {
    startTransition(async () => {
      const result = await regenerateAccessLink(orderId);
      if (result.ok) {
        toast.success(result.message);
        setUrl(result.url);
        setConfirming(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Tautan disalin.");
    } catch {
      toast.error("Gagal menyalin. Salin manual dari kotak tautan.");
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-600">
        Pelanggan membuka pesanannya lewat tautan rahasia. Jika tautan hilang,
        buat yang baru. Tautan lama otomatis tidak berlaku.
      </p>

      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="h-10 rounded-full border border-stone-300 px-5 text-sm font-semibold hover:border-ink"
      >
        Buat tautan akses baru
      </button>

      {url && (
        <div className="space-y-2 rounded-xl bg-mist p-3">
          <label htmlFor="new-link" className="text-xs font-semibold text-neutral-500">
            Tautan baru (hanya tampil sekarang)
          </label>
          <input
            id="new-link"
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-xs"
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={copy} className="h-9 rounded-full bg-ink px-4 text-xs font-semibold text-paper hover:bg-neutral-800">
              Salin
            </button>
            <a
              href={buildWhatsAppUrl(
                customerWhatsapp,
                `Halo ${customerName}, ini tautan pesanan ${orderNumber} dari ${storeName}: ${url}`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-ink px-4 text-xs font-semibold hover:bg-ink hover:text-paper"
            >
              <MessageCircle className="size-3.5" aria-hidden />
              Kirim via WhatsApp
            </a>
          </div>
        </div>
      )}

      <Modal open={confirming} onClose={() => setConfirming(false)} title="Buat tautan baru?">
        <p className="text-sm leading-relaxed text-neutral-700">
          Tautan lama pesanan <strong>{orderNumber}</strong> akan berhenti
          berfungsi. Pastikan tautan baru dikirim ke pelanggan yang benar.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setConfirming(false)} className="h-11 rounded-full border border-stone-300 px-5 text-sm font-semibold hover:border-ink">
            Batal
          </button>
          <button type="button" disabled={pending} onClick={generate} className="flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-paper hover:bg-neutral-800 disabled:opacity-70">
            {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
            Ya, buat baru
          </button>
        </div>
      </Modal>
    </div>
  );
}