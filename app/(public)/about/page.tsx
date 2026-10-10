import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InfoPageShell } from "@/components/store/info-page-shell";
import { RichText } from "@/components/store/rich-text";
import { getContentPage } from "@/lib/data/pages";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getContentPage("about");
  return { title: page?.title ?? "Tentang Kami" };
}

export default async function AboutPage() {
  const page = await getContentPage("about");
  if (!page) notFound();

  return (
    <InfoPageShell title={page.title}>
      <RichText content={page.content} />
    </InfoPageShell>
  );
}