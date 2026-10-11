import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

/** Mengembalikan pengguna panel aktif (ADMIN atau DEMO), atau null. */
export const getAdmin = cache(async () => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) return null;
  return user;
});

/** Untuk halaman dan layout: arahkan ke login jika tidak berhak. */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/**
 * Untuk Server Action dan Route Handler yang MENGUBAH data.
 * Akun demo hanya boleh melihat, jadi ditolak di sini.
 */
export async function requireAdminAction() {
  const admin = await getAdmin();
  if (!admin) throw new Error("Tidak diizinkan.");
  if (admin.role !== "ADMIN") {
    throw new Error("Akun demo hanya dapat melihat data.");
  }
  return admin;
}