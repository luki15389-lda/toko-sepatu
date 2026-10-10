import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL wajib diisi")
    .refine(
      (v) => v.startsWith("postgresql://") || v.startsWith("postgres://"),
      "DATABASE_URL harus berupa URL PostgreSQL"
    ),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET minimal 32 karakter"),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL harus URL valid"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = serverEnvSchema.safeParse(process.env);

if (!parsed.success) {
  const detail = parsed.error.issues
    .map((i) => `- ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(`Konfigurasi environment tidak valid:\n${detail}`);
}

export const env = parsed.data;