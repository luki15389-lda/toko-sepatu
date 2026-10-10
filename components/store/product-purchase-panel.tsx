"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

type Variant = {
  id: string;
  size: string;
  stock: number;
  isAvailable: boolean;
};

export function ProductPurchasePanel({
  variants,
  lowStockThreshold,
  whatsappNumber,
  storeName,
  productName,
}: {
  variants: Variant[];
  lowStockThreshold: number;
  whatsappNumber: string;
  storeName: string;
  productName: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = variants.find((v) => v.id === selectedId) ?? null;

  const message = selected
    ? `Halo ${storeName}, saya ingin bertanya tentang ${productName} ukuran ${selected.size}. Apakah masih tersedia?`
    : `Halo ${storeName}, saya ingin bertanya tentang ${productName}.`;

  const canBuy = (v: Variant) => v.isAvailable && v.stock > 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-bold">Pilih ukuran</h2>
          {selected && (
            <p
              className={cn(
                "text-xs font-medium",
                selected.stock <= lowStockThreshold
                  ? "text-orange-700"
                  : "text-neutral-500"
              )}
              aria-live="polite"
            >
              {selected.stock <= lowStockThreshold
                ? `Sisa ${selected.stock} pasang`
                : "Stok tersedia"}
            </p>
          )}
        </div>

        <ul className="flex flex-wrap gap-2">
          {variants.map((v) => {
            const ok = canBuy(v);
            const isSelected = v.id === selectedId;
            return (
              <li key={v.id}>
                <button
                  type="button"
                  disabled={!ok}
                  aria-pressed={isSelected}
                  aria-label={ok ? `Ukuran ${v.size}` : `Ukuran ${v.size}, stok habis`}
                  onClick={() => setSelectedId(isSelected ? null : v.id)}
                  className={cn(
                    "flex h-12 min-w-14 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition",
                    isSelected
                      ? "border-ink bg-ink text-paper"
                      : "border-stone-300 hover:border-ink",
                    !ok &&
                      "cursor-not-allowed border-stone-200 bg-mist text-stone-400 line-through hover:border-stone-200"
                  )}
                >
                  {v.size}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {whatsappNumber && (
        <a
          href={buildWhatsAppUrl(whatsappNumber, message)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-ink text-sm font-semibold transition hover:bg-ink hover:text-paper"
        >
          <MessageCircle className="size-4" aria-hidden />
          Tanya via WhatsApp
        </a>
      )}
    </div>
  );
}