import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FaqList } from "@/components/store/faq-list";
import { InfoPageShell } from "@/components/store/info-page-shell";
import { getContentPage } from "@/lib/data/pages";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getContentPage("faq");
  return { title: page?.title ?? "FAQ" };
}

export default async function FaqPage() {
  const page = await getContentPage("faq");
  if (!page) notFound();

  return (
    <InfoPageShell title={page.title}>
      <FaqList content={page.content} />
    </InfoPageShell>
  );
}