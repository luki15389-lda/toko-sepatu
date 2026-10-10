import Link from "next/link";
import { SearchX } from "lucide-react";
import { Breadcrumb, type Crumb } from "@/components/shared/breadcrumb";
import { CatalogFiltersForm } from "@/components/store/catalog-filters";
import { FilterToggle } from "@/components/store/filter-toggle";
import { Pagination } from "@/components/store/pagination";
import { ProductCard } from "@/components/store/product-card";
import {
  SORT_OPTIONS,
  filtersToQuery,
  hasActiveFilters,
  parseFilters,
  type CatalogFilters,
  type RawSearchParams,
} from "@/lib/catalog";
import { getCatalogFilterOptions, getCatalogPage } from "@/lib/data/catalog";
import { getStoreSettings } from "@/lib/data/store";
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<RawSearchParams>;
  basePath: string;
  title: string;
  description?: string | null;
  crumbs: Crumb[];
  fixedCategory?: string;
};

function countActive(f: CatalogFilters, fixedCategory?: string): number {
  return (
    (f.q ? 1 : 0) +
    (!fixedCategory && f.category ? 1 : 0) +
    f.brands.length +
    f.sizes.length +
    (f.min !== null || f.max !== null ? 1 : 0)
  );
}

export async function CatalogBody({
  searchParams,
  basePath,
  title,
  description,
  crumbs,
  fixedCategory,
}: Props) {
  const filters = parseFilters(await searchParams, fixedCategory);

  const [options, result, settings] = await Promise.all([
    getCatalogFilterOptions(),
    getCatalogPage(filters),
    getStoreSettings(),
  ]);

  const omitCategory = Boolean(fixedCategory);
  const withQuery = (overrides: Partial<CatalogFilters>) =>
    `${basePath}${filtersToQuery(filters, overrides, { omitCategory })}`;

  const heading = filters.q ? `Hasil pencarian “${filters.q}”` : title;
  const activeCount = countActive(filters, fixedCategory);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <Breadcrumb items={crumbs} />

      <div className="mb-8 mt-4">
        <h1 className="text-3xl font-extrabold sm:text-4xl">{heading}</h1>
        {description && !filters.q && (
          <p className="mt-2 max-w-2xl text-neutral-600">{description}</p>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr] lg:gap-12">
        <aside>
          <FilterToggle activeCount={activeCount}>
            <CatalogFiltersForm
              filters={filters}
              options={options}
              basePath={basePath}
              hideCategory={omitCategory}
            />
          </FilterToggle>
        </aside>

        <section aria-label="Daftar produk">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-neutral-600" aria-live="polite">
              {result.total} produk
            </p>
            <nav aria-label="Urutkan" className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((o) => (
                <Link
                  key={o.value}
                  href={withQuery({ sort: o.value, page: 1 })}
                  aria-current={filters.sort === o.value ? "true" : undefined}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition",
                    filters.sort === o.value
                      ? "border-ink bg-ink text-paper"
                      : "border-stone-300 hover:border-ink"
                  )}
                >
                  {o.label}
                </Link>
              ))}
            </nav>
          </div>

          {result.products.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 px-6 py-16 text-center">
              <SearchX className="size-10 text-neutral-400" aria-hidden />
              <h2 className="mt-4 text-lg font-bold">Produk tidak ditemukan</h2>
              <p className="mt-1 max-w-sm text-sm text-neutral-600">
                {hasActiveFilters(filters, omitCategory)
                  ? "Coba ubah atau hapus sebagian filter, atau gunakan kata kunci lain."
                  : "Belum ada produk yang tersedia saat ini."}
              </p>
              {hasActiveFilters(filters, omitCategory) && (
                <Link
                  href={basePath}
                  className="mt-5 inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-semibold text-paper hover:bg-neutral-800"
                >
                  Reset filter
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:gap-x-6">
              {result.products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  lowStockThreshold={settings.lowStockThreshold}
                />
              ))}
            </div>
          )}

          <Pagination
            basePath={basePath}
            filters={filters}
            page={result.page}
            totalPages={result.totalPages}
            omitCategory={omitCategory}
          />
        </section>
      </div>
    </div>
  );
}