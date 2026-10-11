"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-paper hover:bg-neutral-800 print:hidden"
    >
      <Printer className="size-4" aria-hidden />
      Cetak
    </button>
  );
}