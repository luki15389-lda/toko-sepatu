"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import type { NavLink } from "@/lib/nav";

export function MobileNav({
  links,
  storeName,
}: {
  links: NavLink[];
  storeName: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);

  // <dialog> tampil di lapisan paling atas browser, tidak terkurung oleh navbar
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Halaman di belakang tidak ikut bergulir saat menu terbuka
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buka menu"
        aria-expanded={open}
        className="flex size-10 items-center justify-center rounded-full hover:bg-mist"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <dialog
        ref={ref}
        aria-label="Menu navigasi"
        onClose={() => setOpen(false)}
        onClick={(e) => {
          // klik area gelap di luar panel menutup menu
          if (e.target === ref.current) setOpen(false);
        }}
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-80 max-w-[85%] overflow-y-auto bg-white p-0 shadow-xl backdrop:bg-black/50"
      >
        {open && (
          <div className="flex min-h-full flex-col p-5">
            <div className="mb-6 flex items-center justify-between">
              <Logo name={storeName} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup menu"
                className="flex size-10 items-center justify-center rounded-full hover:bg-mist"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            <form action="/products" method="get" role="search" className="mb-6">
              <label htmlFor="mobile-search" className="sr-only">
                Cari sepatu
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-500"
                  aria-hidden
                />
                <input
                  id="mobile-search"
                  name="q"
                  type="search"
                  placeholder="Cari sepatu..."
                  className="h-11 w-full rounded-full bg-mist pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ink/20"
                />
              </div>
            </form>

            <nav aria-label="Menu utama">
              <ul className="space-y-1">
                {links.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={link.href}
                      data-nav={link.id}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl px-4 py-3 text-base font-semibold transition hover:bg-mist"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}
      </dialog>
    </div>
  );
}