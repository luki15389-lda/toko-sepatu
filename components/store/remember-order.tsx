"use client";

import { useEffect } from "react";

const KEY = "solespace:orders:v1";

export function RememberOrder({
  orderNumber,
  token,
}: {
  orderNumber: string;
  token: string;
}) {
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      const list: { orderNumber: string; token: string; savedAt: number }[] =
        raw ? JSON.parse(raw) : [];
      const next = [
        { orderNumber, token, savedAt: Date.now() },
        ...list.filter((o) => o.orderNumber !== orderNumber),
      ].slice(0, 20);
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // abaikan jika penyimpanan diblokir
    }
  }, [orderNumber, token]);

  return null;
}