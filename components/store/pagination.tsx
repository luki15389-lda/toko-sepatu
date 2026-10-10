import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { filtersToQuery, type CatalogFilters } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export function Pagination({
  basePath,
  filters,
  page,
  totalPages,
  omitCategory,
}: {
  basePath: string;
  filters: CatalogFilters;
  page: number;
  totalPages: number;
  omitCategory: boolean;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) =>
    `${basePath}${filtersToQuery(filters, { page: p }, { omitCategory })}`;

  const wanted = new Set([1, totalPages, page - 1, page, page + 1]);
  const pages = [...wanted]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  const items: (number | "gap")[] = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) items.push("gap");
    items.push(p);
  });

  const base =
    "flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition";

  return (
    <nav aria-label="Halaman" className="mt-12 flex justify-center">
      <ul className="flex items-center gap-1.5">
        <li>
          {page > 1 ? (
            <Link
              href={href(page - 1)}
              aria-label="Halaman sebelumnya"
              className={cn(base, "border border-stone-300 hover:border-ink")}
            >
              <ChevronLeft className="size-4" aria-hidden />
            </Link>
          ) : (
            <span
              aria-hidden
              className={cn(base, "border border-stone-200 text-stone-300")}
            >
              <ChevronLeft className="size-4" />
            </span>
          )}
        </li>

        {items.map((item, i) =>
          item === "gap" ? (
            <li key={`gap-${i}`} aria-hidden className="px-1 text-neutral-400">
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                href={href(item)}
                aria-label={`Halaman ${item}`}
                aria-current={item === page ? "page" : undefined}
                className={cn(
                  base,
                  item === page
                    ? "bg-ink text-paper"
                    : "border border-stone-300 hover:border-ink"
                )}
              >
                {item}
              </Link>
            </li>
          )
        )}

        <li>
          {page < totalPages ? (
            <Link
              href={href(page + 1)}
              aria-label="Halaman berikutnya"
              className={cn(base, "border border-stone-300 hover:border-ink")}
            >
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          ) : (
            <span
              aria-hidden
              className={cn(base, "border border-stone-200 text-stone-300")}
            >
              <ChevronRight className="size-4" />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}