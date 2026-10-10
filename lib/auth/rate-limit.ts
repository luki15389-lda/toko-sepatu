import "server-only";

import { createHmac } from "node:crypto";
import { prisma } from "@/lib/db/prisma";

const WINDOW_MS = 15 * 60 * 1000; // 15 menit
const MAX_FAILURES_PER_EMAIL = 5;
const MAX_FAILURES_PER_IP = 20;

export type LoginKeys = { emailKey: string; ipKey: string };

// Email dan IP tidak disimpan mentah, hanya hasil HMAC-nya.
export function sign(value: string): string {
  return createHmac("sha256", process.env.AUTH_SECRET ?? "")
    .update(value)
    .digest("hex");
}

// Catatan: x-forwarded-for hanya dapat dipercaya jika aplikasi berjalan di
// belakang proxy/hosting tepercaya yang menimpa header ini (mis. Vercel).
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown"
  );
}

export function buildLoginKeys(email: string, ip: string): LoginKeys {
  return {
    emailKey: sign(`email:${email}`),
    ipKey: sign(`ip:${ip}`),
  };
}

export async function isLoginBlocked(keys: LoginKeys): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS);
  const [byEmail, byIp] = await Promise.all([
    prisma.loginAttempt.count({
      where: { key: keys.emailKey, createdAt: { gte: since } },
    }),
    prisma.loginAttempt.count({
      where: { key: keys.ipKey, createdAt: { gte: since } },
    }),
  ]);
  return byEmail >= MAX_FAILURES_PER_EMAIL || byIp >= MAX_FAILURES_PER_IP;
}

export async function recordLoginFailure(keys: LoginKeys): Promise<void> {
  await prisma.loginAttempt.createMany({
    data: [{ key: keys.emailKey }, { key: keys.ipKey }],
  });
  // Bersihkan catatan lama agar tabel tidak membengkak.
  await prisma.loginAttempt.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - WINDOW_MS * 4) } },
  });
}

export async function clearEmailFailures(keys: LoginKeys): Promise<void> {
  await prisma.loginAttempt.deleteMany({ where: { key: keys.emailKey } });
}

/** Penghitung umum (dipakai untuk membatasi pembuatan pesanan). */
export async function countHits(key: string, windowMs: number): Promise<number> {
  return prisma.loginAttempt.count({
    where: { key, createdAt: { gte: new Date(Date.now() - windowMs) } },
  });
}

export async function recordHit(key: string): Promise<void> {
  await prisma.loginAttempt.create({ data: { key } });
}