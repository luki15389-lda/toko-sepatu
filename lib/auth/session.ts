import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

/** Mengembalikan admin aktif, atau null jika belum login / tidak berhak. */
export const getAdmin = cache(async () => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  if (!user || !user.isActive || user.role !== "ADMIN") return null;
  return user;
});

/** Untuk halaman dan layout: arahkan ke login jika tidak berhak. */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/**
 * Untuk Server Action dan Route Handler: lempar error jika tidak berhak.
 * WAJIB dipanggil di awal setiap aksi yang mengubah data.
 */
export async function requireAdminAction() {
  const admin = await getAdmin();
  if (!admin) throw new Error("Tidak diizinkan.");
  return admin;
}