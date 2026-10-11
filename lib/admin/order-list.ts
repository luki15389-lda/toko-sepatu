import type { RawSearchParams } from "@/lib/catalog";
import { ORDER_STATUSES, type OrderStatusValue } from "@/lib/orders/status-flow";

export const ORDER_PAGE_SIZE = 15;

export const PAYMENT_STATUSES = [
  "UNPAID",
  "DP_PARTIAL",
  "PAID",
  "REFUNDED",
  "PAYMENT_CANCELLED",
] as const;
export type PaymentStatusValue = (typeof PAYMENT_STATUSES)[number];

export const ORDER_SORTS = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
  { value: "total_desc", label: "Total tertinggi" },
  { value: "total_asc", label: "Total terendah" },
] as const;
export type OrderSort = (typeof ORDER_SORTS)[number]["value"];

export type AdminOrderFilters = {
  q: string;
  status: OrderStatusValue | null;
  payment: PaymentStatusValue | null;
  from: string | null; // YYYY-MM-DD (WIB)
  to: string | null;
  sort: OrderSort;
  page: number;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function validDate(v: string | undefined): string | null {
  if (!v || !DATE_RE.test(v)) return null;
  return Number.isNaN(new Date(`${v}T00:00:00+07:00`).getTime()) ? null : v;
}

export function parseAdminOrderFilters(raw: RawSearchParams): AdminOrderFilters {
  const status = first(raw.status);
  const payment = first(raw.payment);
  const pageRaw = first(raw.page);

  return {
    q: (first(raw.q) ?? "").trim().slice(0, 100),
    status: (ORDER_STATUSES as readonly string[]).includes(status ?? "")
      ? (status as OrderStatusValue)
      : null,
    payment: (PAYMENT_STATUSES as readonly string[]).includes(payment ?? "")
      ? (payment as PaymentStatusValue)
      : null,
    from: validDate(first(raw.from)),
    to: validDate(first(raw.to)),
    sort: ORDER_SORTS.find((o) => o.value === first(raw.sort))?.value ?? "newest",
    page: pageRaw && /^\d{1,4}$/.test(pageRaw) ? Math.max(1, Number(pageRaw)) : 1,
  };
}

/** Awal dan akhir hari menurut WIB. */
export const wibStart = (d: string) => new Date(`${d}T00:00:00+07:00`);
export const wibEnd = (d: string) => new Date(`${d}T23:59:59.999+07:00`);

export function adminOrderQuery(
  filters: AdminOrderFilters,
  overrides: Partial<AdminOrderFilters> = {}
): string {
  const f = { ...filters, ...overrides };
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.status) p.set("status", f.status);
  if (f.payment) p.set("payment", f.payment);
  if (f.from) p.set("from", f.from);
  if (f.to) p.set("to", f.to);
  if (f.sort !== "newest") p.set("sort", f.sort);
  if (f.page > 1) p.set("page", String(f.page));
  const s = p.toString();
  return s ? `?${s}` : "";
}