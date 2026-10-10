"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Search, X } from "lucide-react";

export type NavLink = { label: string; href: string };

export function MobileNav({
  links,
  storeName,
}: {
  links: NavLink[];
  storeName: string;
}) {
  const [open, setOpen] = useState(false);

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

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi"
            className="absolute inset-y-0 left-0 flex w-80 max-w-[85%] flex-col bg-white p-5 shadow-xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="font-display text-xl font-extrabold tracking-tight">
                {storeName}
              </span>
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
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-3 py-3 text-base font-semibold hover:bg-mist"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}