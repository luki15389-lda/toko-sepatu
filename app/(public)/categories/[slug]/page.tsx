import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CatalogBody } from "@/components/store/catalog-body";
import { CatalogSkeleton } from "@/components/store/skeletons";
import type { RawSearchParams } from "@/lib/catalog";
import { getCategoryBySlug } from "@/lib/data/catalog";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
};

export async function generateMetadata({
  params,
}: Pick<Props, "params">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Kategori tidak ditemukan" };
  return {
    title: category.name,
    description: category.description ?? undefined,
  };
}

async function CategoryContent({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  return (
    <CatalogBody
      searchParams={searchParams}
      basePath={`/categories/${category.slug}`}
      fixedCategory={category.slug}
      title={category.name}
      description={category.description}
      crumbs={[
        { label: "Beranda", href: "/" },
        { label: "Produk", href: "/products" },
        { label: category.name },
      ]}
    />
  );
}

export default function CategoryPage(props: Props) {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CategoryContent {...props} />
    </Suspense>
  );
}