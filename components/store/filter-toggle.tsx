"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export function FilterToggle({
  activeCount,
  children,
}: {
  activeCount: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="panel-filter"
        className="inline-flex h-11 items-center gap-2 rounded-full border border-stone-300 px-5 text-sm font-semibold lg:hidden"
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        Filter{activeCount > 0 ? ` (${activeCount})` : ""}
      </button>

      <div
        id="panel-filter"
        className={cn("mt-4 lg:mt-0", open ? "block" : "hidden lg:block")}
      >
        {children}
      </div>
    </>
  );
}