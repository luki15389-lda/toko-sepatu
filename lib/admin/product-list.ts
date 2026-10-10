import type { RawSearchParams } from "@/lib/catalog";

export const ADMIN_PAGE_SIZE = 15;

export const STATUS_OPTIONS = [
  { value: "active", label: "Aktif (terbit dan draf)" },
  { value: "published", label: "Terbit" },
  { value: "draft", label: "Draf" },
  { value: "archived", label: "Diarsipkan" },
] as const;

export const SORT_OPTIONS = [
  { value: "newest", label: "Terbaru" },
  { value: "name_asc", label: "Nama A-Z" },
  { value: "price_asc", label: "Harga terendah" },
  { value: "price_desc", label: "Harga tertinggi" },
] as const;

export type ProductStatusFilter = (typeof STATUS_OPTIONS)[number]["value"];
export type ProductSort = (typeof SORT_OPTIONS)[number]["value"];

export type AdminProductFilters = {
  q: string;
  categoryId: string | null;
  brandId: string | null;
  status: ProductStatusFilter;
  sort: ProductSort;
  page: number;
};

const ID_RE = /^[a-z0-9]{10,40}$/;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export function parseAdminProductFilters(raw: RawSearchParams): AdminProductFilters {
  const q = (first(raw.q) ?? "").trim().slice(0, 100);
  const category = first(raw.category);
  const brand = first(raw.brand);
  const status =
    STATUS_OPTIONS.find((o) => o.value === first(raw.status))?.value ?? "active";
  const sort = SORT_OPTIONS.find((o) => o.value === first(raw.sort))?.value ?? "newest";
  const pageRaw = first(raw.page);
  const page =
    pageRaw && /^\d{1,4}$/.test(pageRaw) ? Math.max(1, Number(pageRaw)) : 1;

  return {
    q,
    categoryId: category && ID_RE.test(category) ? category : null,
    brandId: brand && ID_RE.test(brand) ? brand : null,
    status,
    sort,
    page,
  };
}

export function adminProductQuery(
  filters: AdminProductFilters,
  overrides: Partial<AdminProductFilters> = {}
): string {
  const f = { ...filters, ...overrides };
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.categoryId) p.set("category", f.categoryId);
  if (f.brandId) p.set("brand", f.brandId);
  if (f.status !== "active") p.set("status", f.status);
  if (f.sort !== "newest") p.set("sort", f.sort);
  if (f.page > 1) p.set("page", String(f.page));
  const s = p.toString();
  return s ? `?${s}` : "";
}