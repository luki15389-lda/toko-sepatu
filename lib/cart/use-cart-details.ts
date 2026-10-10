"use client";

import { useEffect, useMemo, useState } from "react";
import { getCartDetails } from "@/lib/actions/cart";
import type { CartLineDetail } from "@/lib/cart/types";
import type { CartLine } from "@/lib/cart/store";

export function useCartDetails(lines: CartLine[]) {
  const key = lines
    .map((l) => l.variantId)
    .sort()
    .join(",");

  const [result, setResult] = useState<{
    key: string;
    details: CartLineDetail[] | null;
  } | null>(null);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    getCartDetails(key.split(","))
      .then((details) => {
        if (!cancelled) setResult({ key, details });
      })
      .catch(() => {
        if (!cancelled) setResult({ key, details: null });
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const loading = key !== "" && result?.key !== key;
  const failed = key !== "" && result?.key === key && result.details === null;

  const map = useMemo(
    () => new Map((result?.details ?? []).map((d) => [d.variantId, d])),
    [result]
  );

  return { map, loading, failed };
}

export type CartRowProblem =
  | "loading"
  | "unavailable"
  | "out_of_stock"
  | "insufficient"
  | null;

export type CartRow = {
  line: CartLine;
  detail: CartLineDetail | null;
  problem: CartRowProblem;
};

export function buildRows(
  lines: CartLine[],
  map: Map<string, CartLineDetail>,
  loading: boolean
): CartRow[] {
  return lines.map((line) => {
    const detail = map.get(line.variantId) ?? null;
    let problem: CartRowProblem = null;
    if (!detail) problem = loading ? "loading" : "unavailable";
    else if (detail.status === "unavailable") problem = "unavailable";
    else if (detail.stock <= 0) problem = "out_of_stock";
    else if (line.quantity > detail.stock) problem = "insufficient";
    return { line, detail, problem };
  });
}

/** Total tampilan saja. Total yang sah selalu dihitung ulang di server saat checkout. */
export function computeTotal(rows: CartRow[]): number {
  return rows.reduce(
    (sum, r) =>
      r.detail && r.detail.status === "ok"
        ? sum + r.detail.unitPrice * r.line.quantity
        : sum,
    0
  );
}