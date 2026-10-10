"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { QuantityStepper } from "@/components/shared/quantity-stepper";
import { MAX_QTY_PER_LINE } from "@/lib/cart/constants";
import { addToCart } from "@/lib/cart/store";
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
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const canBuy = (v: Variant) => v.isAvailable && v.stock > 0;
  const anyAvailable = variants.some(canBuy);
  const selected = variants.find((v) => v.id === selectedId) ?? null;
  const maxQty = selected
    ? Math.max(1, Math.min(selected.stock, MAX_QTY_PER_LINE))
    : MAX_QTY_PER_LINE;

  function selectSize(id: string) {
    setSelectedId((cur) => (cur === id ? null : id));
    setQuantity(1);
  }

  function handleAdd(thenCheckout: boolean) {
    if (!selected) {
      toast.error("Pilih ukuran terlebih dahulu.");
      return;
    }

    const result = addToCart(selected.id, quantity, maxQty);

    if (result.full) {
      toast.error("Keranjang penuh. Selesaikan atau hapus sebagian pesanan.");
      return;
    }
    if (result.added === 0 && !thenCheckout) {
      toast.error("Jumlah di keranjang sudah mencapai batas stok.");
      return;
    }

    if (thenCheckout) {
      router.push("/checkout");
      return;
    }

    if (result.added < quantity) {
      toast.info("Jumlah disesuaikan dengan stok yang tersedia.");
    }
    toast.success("Ditambahkan ke keranjang.", {
      action: { label: "Lihat keranjang", onClick: () => router.push("/cart") },
    });
  }

  const inquiryMessage = selected
    ? `Halo ${storeName}, saya ingin bertanya tentang ${productName} ukuran ${selected.size}.`
    : `Halo ${storeName}, saya ingin bertanya tentang ${productName}.`;

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
                  onClick={() => selectSize(v.id)}
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

      <div className="flex items-center gap-4">
        <span className="text-sm font-bold">Jumlah</span>
        <QuantityStepper
          label={`Jumlah ${productName}`}
          value={quantity}
          max={maxQty}
          disabled={!anyAvailable}
          onChange={setQuantity}
        />
      </div>

      <div className="space-y-3">
        <button
          type="button"
          disabled={!anyAvailable}
          onClick={() => handleAdd(false)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-paper transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
        >
          <ShoppingBag className="size-4" aria-hidden />
          Tambah ke Keranjang
        </button>

        <button
          type="button"
          disabled={!anyAvailable}
          onClick={() => handleAdd(true)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-ink text-sm font-semibold transition hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:border-stone-300 disabled:text-stone-400 disabled:hover:bg-transparent"
        >
          <MessageCircle className="size-4" aria-hidden />
          Pesan via WhatsApp
        </button>
        <p className="text-center text-xs text-neutral-500">
          Lanjut ke checkout, lalu kirim konfirmasi ke WhatsApp penjual.
        </p>
      </div>

      {whatsappNumber && (
        <p className="text-center text-sm text-neutral-600">
          Hanya ingin bertanya?{" "}
          <a
            href={buildWhatsAppUrl(whatsappNumber, inquiryMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-ink underline underline-offset-4"
          >
            Chat penjual
          </a>
        </p>
      )}
    </div>
  );
}