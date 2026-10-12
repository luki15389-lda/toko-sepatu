"use client";

import { useEffect } from "react";
import type { NavId } from "@/lib/nav";

/**
 * Daftar penanda halaman yang sedang aktif (terlihat). Next.js menyimpan halaman
 * yang baru dikunjungi dalam keadaan tersembunyi dan menghentikan efeknya,
 * jadi penanda halaman lama otomatis keluar dari daftar ini.
 */
const active = new Map<symbol, NavId>();

function apply() {
  const values = [...active.values()];
  const latest = values[values.length - 1];
  if (latest) document.body.dataset.navPage = latest;
  else delete document.body.dataset.navPage;
}

export function NavMarker({ page }: { page: NavId }) {
  useEffect(() => {
    const key = Symbol(page);
    active.set(key, page);
    document.body.dataset.navJs = "true";
    apply();

    return () => {
      active.delete(key);
      apply();
    };
  }, [page]);

  // Dipakai CSS untuk tampilan pertama dari server (sebelum JavaScript aktif)
  return <span data-nav-page={page} hidden aria-hidden="true" />;
}