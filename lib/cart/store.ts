"use client";

import { useMemo, useSyncExternalStore } from "react";
import { MAX_LINES, MAX_QTY_PER_LINE } from "@/lib/cart/constants";

export type CartLine = { variantId: string; quantity: number };

const STORAGE_KEY = "solespace:cart:v1";
const EMPTY = "[]";
const listeners = new Set<() => void>();

function readRaw(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? EMPTY;
  } catch {
    return EMPTY;
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

/** Membaca dan membersihkan data keranjang dari browser (tidak pernah dipercaya begitu saja). */
export function parseLines(raw: string): CartLine[] {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];

  const merged = new Map<string, number>();
  for (const item of data) {
    if (
      typeof item === "object" &&
      item !== null &&
      typeof (item as CartLine).variantId === "string" &&
      Number.isInteger((item as CartLine).quantity)
    ) {
      const { variantId, quantity } = item as CartLine;
      if (variantId.length === 0 || variantId.length > 40 || quantity < 1) continue;
      merged.set(
        variantId,
        Math.min((merged.get(variantId) ?? 0) + quantity, MAX_QTY_PER_LINE)
      );
    }
  }
  return [...merged.entries()]
    .slice(0, MAX_LINES)
    .map(([variantId, quantity]) => ({ variantId, quantity }));
}

function current(): CartLine[] {
  return parseLines(readRaw());
}

function save(lines: CartLine[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // penyimpanan penuh atau diblokir: abaikan
  }
  emit();
}

export function useCartLines(): CartLine[] {
  const raw = useSyncExternalStore(subscribe, readRaw, () => EMPTY);
  return useMemo(() => parseLines(raw), [raw]);
}

const noopSubscribe = () => () => {};

/** false saat render di server / sebelum hydration, true setelah di browser. */
export function useCartReady(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

export function useCartCount(): number {
  return useCartLines().reduce((sum, l) => sum + l.quantity, 0);
}

export function addToCart(
  variantId: string,
  quantity: number,
  maxQty: number
): { added: number; total: number; full: boolean } {
  const lines = current();
  const existing = lines.find((l) => l.variantId === variantId);

  if (!existing && lines.length >= MAX_LINES) {
    return { added: 0, total: 0, full: true };
  }

  const before = existing?.quantity ?? 0;
  const after = Math.min(before + quantity, maxQty, MAX_QTY_PER_LINE);
  const added = Math.max(0, after - before);

  if (added > 0) {
    save(
      existing
        ? lines.map((l) => (l.variantId === variantId ? { ...l, quantity: after } : l))
        : [...lines, { variantId, quantity: after }]
    );
  }
  return { added, total: after, full: false };
}

export function setLineQuantity(variantId: string, quantity: number) {
  const q = Math.min(Math.max(1, quantity), MAX_QTY_PER_LINE);
  save(current().map((l) => (l.variantId === variantId ? { ...l, quantity: q } : l)));
}

export function changeLineVariant(fromId: string, toId: string) {
  if (fromId === toId) return;
  const lines = current();
  const from = lines.find((l) => l.variantId === fromId);
  if (!from) return;

  const target = lines.find((l) => l.variantId === toId);
  const rest = lines.filter((l) => l.variantId !== fromId && l.variantId !== toId);
  const quantity = Math.min(from.quantity + (target?.quantity ?? 0), MAX_QTY_PER_LINE);
  // posisi tetap di tempat baris asal
  const index = lines.findIndex((l) => l.variantId === fromId);
  const next = [...rest];
  next.splice(Math.min(index, next.length), 0, { variantId: toId, quantity });
  save(next);
}

export function removeLine(variantId: string) {
  save(current().filter((l) => l.variantId !== variantId));
}

export function clearCart() {
  save([]);
}