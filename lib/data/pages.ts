import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db/prisma";

export type InfoPage = { slug: string; title: string; content: string };

const select = { slug: true, title: true, content: true } as const;

export async function getContentPage(slug: string): Promise<InfoPage | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("pages");

  return prisma.contentPage.findFirst({
    where: { slug, isPublished: true },
    select,
  });
}

/** Mengambil beberapa halaman sekaligus, urutannya mengikuti daftar slug. */
export async function getContentPages(slugs: string[]): Promise<InfoPage[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("pages");

  const rows = await prisma.contentPage.findMany({
    where: { slug: { in: slugs }, isPublished: true },
    select,
  });

  return slugs
    .map((slug) => rows.find((r) => r.slug === slug))
    .filter((r): r is InfoPage => r !== undefined);
}