export const PAGE_SIZE = 12;
const MAX_PRICE = 100_000_000;

export const SORT_OPTIONS = [
  { value: "newest", label: "Terbaru" },
  { value: "price_asc", label: "Harga terendah" },
  { value: "price_desc", label: "Harga tertinggi" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export type CatalogFilters = {
  q: string;
  category: string | null;
  brands: string[];
  sizes: string[];
  min: number | null;
  max: number | null;
  sort: SortValue;
  page: number;
};

export type RawSearchParams = Record<string, string | string[] | undefined>;

const SLUG_RE = /^[a-z0-9-]{1,80}$/;
const SIZE_RE = /^[A-Za-z0-9.\-/ ]{1,10}$/;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function many(v: string | string[] | undefined): string[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

function toInt(v: string | undefined, max: number): number | null {
  if (!v || !/^\d{1,12}$/.test(v)) return null;
  return Math.min(Number(v), max);
}

export function parseFilters(
  raw: RawSearchParams,
  fixedCategory?: string
): CatalogFilters {
  const q = (first(raw.q) ?? "").trim().slice(0, 100);

  const categoryRaw = fixedCategory ?? first(raw.category);
  const category =
    categoryRaw && SLUG_RE.test(categoryRaw) ? categoryRaw : null;

  const brands = [...new Set(many(raw.brand).filter((b) => SLUG_RE.test(b)))].slice(0, 20);
  const sizes = [...new Set(many(raw.size).filter((s) => SIZE_RE.test(s)))].slice(0, 20);

  let min = toInt(first(raw.min), MAX_PRICE);
  let max = toInt(first(raw.max), MAX_PRICE);
  if (min !== null && max !== null && min > max) [min, max] = [max, min];

  const sortRaw = first(raw.sort);
  const sort: SortValue =
    SORT_OPTIONS.find((o) => o.value === sortRaw)?.value ?? "newest";

  const page = Math.max(1, toInt(first(raw.page), 1000) ?? 1);

  return { q, category, brands, sizes, min, max, sort, page };
}

/** Bangun query string dari filter. Nilai default tidak ikut ditulis. */
export function filtersToQuery(
  filters: CatalogFilters,
  overrides: Partial<CatalogFilters> = {},
  options: { omitCategory?: boolean } = {}
): string {
  const f = { ...filters, ...overrides };
  const p = new URLSearchParams();

  if (f.q) p.set("q", f.q);
  if (f.category && !options.omitCategory) p.set("category", f.category);
  f.brands.forEach((b) => p.append("brand", b));
  f.sizes.forEach((s) => p.append("size", s));
  if (f.min !== null) p.set("min", String(f.min));
  if (f.max !== null) p.set("max", String(f.max));
  if (f.sort !== "newest") p.set("sort", f.sort);
  if (f.page > 1) p.set("page", String(f.page));

  const s = p.toString();
  return s ? `?${s}` : "";
}

export function hasActiveFilters(
  f: CatalogFilters,
  ignoreCategory = false
): boolean {
  return Boolean(
    f.q ||
      (!ignoreCategory && f.category) ||
      f.brands.length ||
      f.sizes.length ||
      f.min !== null ||
      f.max !== null
  );
}