/** Persentase diskon (dibulatkan), atau null jika tidak ada diskon. */
export function discountPercent(
  price: number,
  discountPrice: number | null
): number | null {
  if (discountPrice == null || discountPrice >= price || price <= 0) return null;
  return Math.round(((price - discountPrice) / price) * 100);
}

export type StockLevel = "ok" | "low" | "out";

export function getStockInfo(totalStock: number, lowThreshold: number) {
  if (totalStock <= 0) return { level: "out" as StockLevel, text: "Stok habis" };
  if (totalStock <= lowThreshold) {
    return { level: "low" as StockLevel, text: "Stok terbatas" };
  }
  return { level: "ok" as StockLevel, text: "Tersedia" };
}