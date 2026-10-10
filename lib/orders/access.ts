import "server-only";

import { createHash, randomBytes, randomInt } from "node:crypto";

// Tanpa huruf/angka yang mudah tertukar (0, O, 1, I)
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Contoh: SOL-261010-K7M2PQ (tanggal WIB + 6 karakter acak) */
export function generateOrderNumber(): string {
  const wib = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const ymd = wib.toISOString().slice(2, 10).replace(/-/g, "");
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += ALPHABET[randomInt(ALPHABET.length)];
  return `SOL-${ymd}-${suffix}`;
}

/** Token rahasia 256-bit untuk tautan akses pesanan. Hanya hash-nya yang disimpan. */
export function generateAccessToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashAccessToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}