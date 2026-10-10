import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/store/product-card";
import type { ProductCardData } from "@/lib/data/products";

export function ProductSection({
  title,
  description,
  products,
  href,
  lowStockThreshold,
}: {
  title: string;
  description?: string;
  products: ProductCardData[];
  href?: string;
  lowStockThreshold?: number;
}) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold sm:text-3xl">{title}</h2>
          {description && (
            <p className="mt-1.5 text-sm text-neutral-500">{description}</p>
          )}
        </div>
        {href && (
          <Link
            href={href}
            className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline"
          >
            Lihat semua
            <ArrowRight
              className="size-4 transition group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            lowStockThreshold={lowStockThreshold}
          />
        ))}
      </div>
    </section>
  );
}