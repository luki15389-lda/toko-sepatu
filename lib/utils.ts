import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format rupiah integer, contoh: 1500000 -> "Rp1.500.000" */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/\s/g, "");
}

/** Format tanggal Indonesia, contoh: "10 Oktober 2026" */
export function formatTanggal(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(date));
}

/** Format tanggal dan jam Indonesia (WIB), contoh: "10 Oktober 2026 pukul 14.30" */
export function formatTanggalWaktu(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(date));
}

/** Tanggal hari ini menurut WIB, format YYYY-MM-DD. */
export function todayWib(): string {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}