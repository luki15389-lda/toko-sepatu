import Link from "next/link";
import type { CatalogFilters } from "@/lib/catalog";
import type { CatalogFilterOptions } from "@/lib/data/catalog";

const inputClass =
  "h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10";

export function CatalogFiltersForm({
  filters,
  options,
  basePath,
  hideCategory,
}: {
  filters: CatalogFilters;
  options: CatalogFilterOptions;
  basePath: string;
  hideCategory: boolean;
}) {
  return (
    <form
      action={basePath}
      method="get"
      aria-label="Filter produk"
      className="space-y-7"
    >
      {filters.sort !== "newest" && (
        <input type="hidden" name="sort" value={filters.sort} />
      )}

      <div>
        <label htmlFor="f-q" className="mb-2 block text-sm font-bold">
          Cari
        </label>
        <input
          id="f-q"
          name="q"
          type="search"
          defaultValue={filters.q}
          placeholder="Nama produk atau merek"
          className={inputClass}
        />
      </div>

      {!hideCategory && options.categories.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-bold">Kategori</legend>
          <div className="space-y-2">
            <label className="flex items-center gap-2.5 text-sm">
              <input
                type="radio"
                name="category"
                value=""
                defaultChecked={!filters.category}
                className="size-4 accent-black"
              />
              Semua kategori
            </label>
            {options.categories.map((c) => (
              <label key={c.slug} className="flex items-center gap-2.5 text-sm">
                <input
                  type="radio"
                  name="category"
                  value={c.slug}
                  defaultChecked={filters.category === c.slug}
                  className="size-4 accent-black"
                />
                <span>{c.name}</span>
                <span className="text-neutral-400">({c.count})</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {options.brands.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-bold">Merek</legend>
          <div className="space-y-2">
            {options.brands.map((b) => (
              <label key={b.slug} className="flex items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  name="brand"
                  value={b.slug}
                  defaultChecked={filters.brands.includes(b.slug)}
                  className="size-4 accent-black"
                />
                <span>{b.name}</span>
                <span className="text-neutral-400">({b.count})</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {options.sizes.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-bold">Ukuran</legend>
          <div className="flex flex-wrap gap-2">
            {options.sizes.map((size) => (
              <label key={size} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="size"
                  value={size}
                  defaultChecked={filters.sizes.includes(size)}
                  className="peer sr-only"
                />
                <span className="flex h-10 min-w-12 items-center justify-center rounded-lg border border-stone-300 px-3 text-sm font-medium transition peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:ring-2 peer-focus-visible:ring-ink/40">
                  {size}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-2 text-sm font-bold">Rentang harga (Rp)</legend>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="f-min">
            Harga minimum
          </label>
          <input
            id="f-min"
            name="min"
            type="number"
            inputMode="numeric"
            min={0}
            step={1000}
            defaultValue={filters.min ?? ""}
            placeholder="Min"
            className={inputClass}
          />
          <span aria-hidden className="text-neutral-400">
            -
          </span>
          <label className="sr-only" htmlFor="f-max">
            Harga maksimum
          </label>
          <input
            id="f-max"
            name="max"
            type="number"
            inputMode="numeric"
            min={0}
            step={1000}
            defaultValue={filters.max ?? ""}
            placeholder="Maks"
            className={inputClass}
          />
        </div>
      </fieldset>

      <div className="flex gap-3">
        <button
          type="submit"
          className="h-11 flex-1 rounded-full bg-ink text-sm font-semibold text-paper transition hover:bg-neutral-800"
        >
          Terapkan
        </button>
        <Link
          href={basePath}
          className="flex h-11 items-center rounded-full border border-stone-300 px-5 text-sm font-semibold transition hover:border-ink"
        >
          Reset
        </Link>
      </div>
    </form>
  );
}