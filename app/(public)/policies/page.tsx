import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InfoPageShell } from "@/components/store/info-page-shell";
import { RichText } from "@/components/store/rich-text";
import { getContentPages } from "@/lib/data/pages";

export const metadata: Metadata = { title: "Kebijakan Toko" };

const POLICY_SLUGS = [
  "kebijakan-pemesanan",
  "kebijakan-pembatalan",
  "kebijakan-pengembalian",
];

export default async function PoliciesPage() {
  const pages = await getContentPages(POLICY_SLUGS);
  if (pages.length === 0) notFound();

  return (
    <InfoPageShell title="Kebijakan Toko">
      <nav aria-label="Daftar kebijakan" className="mb-10">
        <ul className="flex flex-wrap gap-2">
          {pages.map((p) => (
            <li key={p.slug}>
              <a
                href={`#${p.slug}`}
                className="inline-block rounded-full border border-stone-300 px-4 py-1.5 text-sm font-medium transition hover:border-ink"
              >
                {p.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-12">
        {pages.map((p) => (
          <section key={p.slug} id={p.slug} className="scroll-mt-28">
            <h2 className="mb-4 text-2xl font-extrabold">{p.title}</h2>
            <RichText content={p.content} />
          </section>
        ))}
      </div>
    </InfoPageShell>
  );
}