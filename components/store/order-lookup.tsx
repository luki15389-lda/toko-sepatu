"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatTanggal } from "@/lib/utils";

const KEY = "solespace:orders:v1";
const listeners = new Set<() => void>();

type Saved = { orderNumber: string; token: string; savedAt: number };

function readRaw(): string {
  try {
    return window.localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function parse(raw: string): Saved[] {
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(
      (o): o is Saved =>
        typeof o === "object" &&
        o !== null &&
        typeof (o as Saved).orderNumber === "string" &&
        typeof (o as Saved).token === "string" &&
        typeof (o as Saved).savedAt === "number"
    );
  } catch {
    return [];
  }
}

function removeSaved(orderNumber: string) {
  try {
    const next = parse(readRaw()).filter((o) => o.orderNumber !== orderNumber);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // abaikan
  }
  listeners.forEach((l) => l());
}

export function OrderLookup({ whatsappUrl }: { whatsappUrl: string | null }) {
  const router = useRouter();
  const raw = useSyncExternalStore(subscribe, readRaw, () => "[]");
  const saved = useMemo(() => parse(raw), [raw]);
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    let orderNumber = "";
    let token = "";
    try {
      const url = new URL(link.trim());
      const match = url.pathname.match(/^\/orders\/([A-Za-z0-9-]{8,30})\/?$/);
      orderNumber = match?.[1]?.toUpperCase() ?? "";
      token = url.searchParams.get("t") ?? "";
    } catch {
      // tautan tidak valid
    }

    if (!orderNumber || !/^[A-Za-z0-9_-]{20,64}$/.test(token)) {
      setError("Tautan pesanan tidak valid. Tempel tautan lengkap yang Anda terima saat membuat pesanan.");
      return;
    }
    // Selalu menuju alamat internal, bukan alamat dari tautan yang ditempel
    router.push(`/orders/${orderNumber}?t=${token}`);
  }

  return (
    <div className="space-y-10">
      <section aria-labelledby="h-saved">
        <h2 id="h-saved" className="mb-3 text-lg font-bold">Pesanan di perangkat ini</h2>
        {saved.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-300 px-6 py-10 text-center text-sm text-neutral-600">
            Belum ada pesanan tersimpan di perangkat ini.
          </p>
        ) : (
          <ul className="divide-y divide-stone-line rounded-2xl border border-stone-line">
            {saved.map((o) => (
              <li key={o.orderNumber} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm">
                <div>
                  <Link
                    href={`/orders/${o.orderNumber}?t=${o.token}`}
                    className="font-semibold hover:underline"
                  >
                    {o.orderNumber}
                  </Link>
                  <p className="text-xs text-neutral-500">Dibuat {formatTanggal(new Date(o.savedAt))}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeSaved(o.orderNumber)}
                  className="text-xs font-semibold text-neutral-500 underline underline-offset-2 hover:text-ink"
                >
                  Hapus dari perangkat ini
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="h-link">
        <h2 id="h-link" className="mb-3 text-lg font-bold">Buka dengan tautan pesanan</h2>
        <form onSubmit={submit} className="space-y-3" noValidate>
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>
          )}
          <label htmlFor="order-link" className="text-sm font-semibold">Tautan pesanan</label>
          <input
            id="order-link"
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://.../orders/SOL-...?t=..."
            className="h-12 w-full rounded-xl border border-stone-300 px-4 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/10"
          />
          <button type="submit" className="h-12 rounded-full bg-ink px-7 text-sm font-semibold text-paper hover:bg-neutral-800">
            Buka pesanan
          </button>
        </form>

        <p className="mt-5 text-sm leading-relaxed text-neutral-600">
          Demi keamanan, pesanan hanya bisa dibuka dengan tautan rahasia yang
          diberikan saat Anda membuat pesanan. Kehilangan tautan?{" "}
          {whatsappUrl ? (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline underline-offset-2">
              Hubungi penjual lewat WhatsApp
            </a>
          ) : (
            "Hubungi penjual"
          )}
          , dan mereka dapat membuatkan tautan baru.
        </p>
      </section>
    </div>
  );
}