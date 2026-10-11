import type { Metadata } from "next";
import { PagesManager } from "@/components/admin/pages-manager";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = { title: "Halaman Informasi" };

const PUBLIC_HREF: Record<string, string> = {
  about: "/about",
  contact: "/contact",
  faq: "/faq",
  "kebijakan-pemesanan": "/policies#kebijakan-pemesanan",
  "kebijakan-pembatalan": "/policies#kebijakan-pembatalan",
  "kebijakan-pengembalian": "/policies#kebijakan-pengembalian",
};

export default async function AdminPagesPage() {
  await requireAdmin();

  const pages = await prisma.contentPage.findMany({ orderBy: { slug: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Halaman informasi</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Ubah isi Tentang Kami, Kontak, FAQ, dan kebijakan toko.
        </p>
      </div>
      <PagesManager
        items={pages.map((p) => ({
          slug: p.slug,
          title: p.title,
          content: p.content,
          isPublished: p.isPublished,
          updatedAt: p.updatedAt.toISOString(),
          publicHref: PUBLIC_HREF[p.slug] ?? "/",
        }))}
      />
    </div>
  );
}