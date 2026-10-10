import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogBody } from "@/components/store/catalog-body";
import { CatalogSkeleton } from "@/components/store/skeletons";
import type { RawSearchParams } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Semua Produk",
  description: "Telusuri seluruh koleksi sneakers kami.",
};

export default function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogBody
        searchParams={searchParams}
        basePath="/products"
        title="Semua Produk"
        description="Telusuri seluruh koleksi sneakers kami."
        crumbs={[{ label: "Beranda", href: "/" }, { label: "Produk" }]}
      />
    </Suspense>
  );
}