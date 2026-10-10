"use client";

import { Minus, Plus } from "lucide-react";

export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  label,
  disabled = false,
}: {
  value: number;
  min?: number;
  max: number;
  onChange: (next: number) => void;
  label: string;
  disabled?: boolean;
}) {
  const btn =
    "flex size-11 items-center justify-center rounded-full transition hover:bg-mist disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex h-11 items-center rounded-full border border-stone-300"
    >
      <button
        type="button"
        aria-label="Kurangi jumlah"
        disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)}
        className={btn}
      >
        <Minus className="size-4" aria-hidden />
      </button>
      <span aria-live="polite" className="w-8 text-center text-sm font-semibold">
        {value}
      </span>
      <button
        type="button"
        aria-label="Tambah jumlah"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
        className={btn}
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}